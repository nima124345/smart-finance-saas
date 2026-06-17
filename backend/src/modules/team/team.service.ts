import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivityService } from '../activity/activity.service';
import { ACTIVITY } from '../activity/activity.constants';
import { ROLE_LABELS } from '../../common/constants/permissions';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน

interface Actor {
  userId: bigint;
  role: MembershipRole;
}

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly activity: ActivityService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Manager (admin) จัดการได้เฉพาะ Staff (member); Owner จัดการได้ทุกคนยกเว้น owner */
  private assertCanManageTarget(actorRole: MembershipRole, targetRole: MembershipRole) {
    if (targetRole === 'owner') {
      throw new ForbiddenException('ไม่สามารถจัดการเจ้าของ workspace ได้');
    }
    if (actorRole === 'admin' && targetRole !== 'member') {
      throw new ForbiddenException('Manager จัดการได้เฉพาะ Staff เท่านั้น');
    }
  }

  // ── MEMBERS ────────────────────────────────────────────────
  async listMembers(workspaceId: bigint) {
    const members = await this.prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            publicId: true,
            name: true,
            email: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      publicId: m.user.publicId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      roleLabel: ROLE_LABELS[m.role],
      lastLoginAt: m.user.lastLoginAt?.toISOString() ?? null,
      joinedAt: m.createdAt.toISOString(),
    }));
  }

  async listInvitations(workspaceId: bigint) {
    const invites = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => ({
      publicId: i.publicId,
      email: i.email,
      role: i.role,
      roleLabel: ROLE_LABELS[i.role],
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  // ── INVITE ─────────────────────────────────────────────────
  async invite(workspaceId: bigint, actor: Actor, dto: InviteMemberDto) {
    if (dto.role === 'owner') {
      throw new BadRequestException('เชิญเป็น Owner ไม่ได้');
    }
    // Manager เชิญได้เฉพาะ Staff
    if (actor.role === 'admin' && dto.role !== 'member') {
      throw new ForbiddenException('Manager เชิญได้เฉพาะ Staff');
    }

    // plan รองรับทีม + ยังไม่ชนเพดานสมาชิก
    await this.subscriptions.assertCanInviteMember(workspaceId);

    const email = dto.email.toLowerCase();

    // เป็นสมาชิกอยู่แล้วไหม
    const existingMember = await this.prisma.membership.findFirst({
      where: { workspaceId, user: { email, deletedAt: null } },
      select: { id: true },
    });
    if (existingMember) {
      throw new ConflictException('อีเมลนี้เป็นสมาชิกอยู่แล้ว');
    }

    // มีคำเชิญค้างอยู่แล้วไหม
    const pending = await this.prisma.workspaceInvitation.findFirst({
      where: { workspaceId, email, status: 'pending' },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException('มีคำเชิญที่ค้างอยู่สำหรับอีเมลนี้แล้ว');
    }

    const rawToken = randomBytes(32).toString('hex');
    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        role: dto.role,
        tokenHash: this.hashToken(rawToken),
        invitedById: actor.userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    await this.activity.log({
      workspaceId,
      actorId: actor.userId,
      action: ACTIVITY.MEMBER_INVITE,
      targetType: 'invitation',
      targetId: invitation.publicId,
      metadata: { email, role: dto.role },
    });

    // dev: log ลิงก์รับคำเชิญ; prod: ส่งอีเมล (TODO mail provider)
    const link = `${this.config.get('app.frontendUrl')}/invite?token=${rawToken}`;
    if (this.config.get<string>('app.env') !== 'production') {
      this.logger.log(`✉️  Invite link (${email}): ${link}`);
    }
    // TODO(prod): ส่งอีเมลคำเชิญจริงที่นี่

    return {
      publicId: invitation.publicId,
      email: invitation.email,
      role: invitation.role,
      roleLabel: ROLE_LABELS[invitation.role],
      expiresAt: invitation.expiresAt.toISOString(),
      // ส่ง token กลับเฉพาะ non-production เพื่อให้ทดสอบ flow ได้โดยไม่ต้องมีอีเมล
      ...(this.config.get<string>('app.env') !== 'production'
        ? { inviteToken: rawToken, inviteLink: link }
        : {}),
    };
  }

  async revokeInvitation(
    workspaceId: bigint,
    actor: Actor,
    invitationPublicId: string,
  ) {
    const invite = await this.prisma.workspaceInvitation.findFirst({
      where: { workspaceId, publicId: invitationPublicId, status: 'pending' },
    });
    if (!invite) throw new NotFoundException('ไม่พบคำเชิญ');

    await this.prisma.workspaceInvitation.update({
      where: { id: invite.id },
      data: { status: 'revoked' },
    });
    await this.activity.log({
      workspaceId,
      actorId: actor.userId,
      action: ACTIVITY.INVITE_REVOKE,
      targetType: 'invitation',
      targetId: invite.publicId,
      metadata: { email: invite.email },
    });
  }

  // ── PREVIEW (ดูรายละเอียดคำเชิญก่อนรับ — ไม่ต้องเป็นสมาชิก) ──
  async previewInvitation(rawToken: string) {
    const invite = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
      include: {
        workspace: { select: { name: true, type: true } },
        invitedBy: { select: { name: true } },
      },
    });
    if (
      !invite ||
      invite.status !== 'pending' ||
      invite.expiresAt < new Date()
    ) {
      throw new NotFoundException('คำเชิญไม่ถูกต้องหรือหมดอายุ');
    }
    return {
      email: invite.email,
      role: invite.role,
      roleLabel: ROLE_LABELS[invite.role],
      workspaceName: invite.workspace.name,
      workspaceType: invite.workspace.type,
      invitedByName: invite.invitedBy.name,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  // ── ACCEPT (เรียกโดยผู้ถูกเชิญที่ login แล้ว) ───────────────
  async acceptInvitation(user: { id: bigint; email: string }, rawToken: string) {
    const invite = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!invite || invite.status !== 'pending') {
      throw new NotFoundException('คำเชิญไม่ถูกต้องหรือถูกใช้ไปแล้ว');
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('คำเชิญหมดอายุแล้ว');
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('คำเชิญนี้ออกให้อีเมลอื่น');
    }

    // กันสมาชิกซ้ำ (เผื่อถูกเพิ่มไปแล้ว)
    const already = await this.prisma.membership.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id },
      },
      select: { id: true },
    });

    const workspace = await this.prisma.$transaction(async (tx) => {
      if (!already) {
        await tx.membership.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: user.id,
            role: invite.role,
          },
        });
      }
      await tx.workspaceInvitation.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      return tx.workspace.findUnique({
        where: { id: invite.workspaceId },
        select: { publicId: true, name: true, type: true, baseCurrency: true },
      });
    });

    await this.activity.log({
      workspaceId: invite.workspaceId,
      actorId: user.id,
      action: ACTIVITY.MEMBER_JOIN,
      targetType: 'user',
      metadata: { role: invite.role },
    });

    return {
      workspace,
      role: invite.role,
      roleLabel: ROLE_LABELS[invite.role],
    };
  }

  // ── CHANGE ROLE (Owner เท่านั้น) ───────────────────────────
  async changeRole(
    workspaceId: bigint,
    actor: Actor,
    targetPublicId: string,
    dto: ChangeRoleDto,
  ) {
    if (actor.role !== 'owner') {
      throw new ForbiddenException('เฉพาะ Owner เท่านั้นที่เปลี่ยน role ได้');
    }
    if (dto.role === 'owner') {
      throw new BadRequestException('ตั้งเป็น Owner ผ่านช่องทางนี้ไม่ได้');
    }

    const membership = await this.findTargetMembership(workspaceId, targetPublicId);
    if (membership.role === 'owner') {
      throw new ForbiddenException('เปลี่ยน role ของ Owner ไม่ได้');
    }
    if (membership.userId === actor.userId) {
      throw new BadRequestException('เปลี่ยน role ของตัวเองไม่ได้');
    }

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: { role: dto.role },
    });
    await this.activity.log({
      workspaceId,
      actorId: actor.userId,
      action: ACTIVITY.MEMBER_ROLE_CHANGE,
      targetType: 'user',
      targetId: targetPublicId,
      metadata: { from: membership.role, to: dto.role },
    });

    return { publicId: targetPublicId, role: dto.role, roleLabel: ROLE_LABELS[dto.role] };
  }

  // ── REMOVE MEMBER ──────────────────────────────────────────
  async removeMember(workspaceId: bigint, actor: Actor, targetPublicId: string) {
    const membership = await this.findTargetMembership(workspaceId, targetPublicId);
    if (membership.userId === actor.userId) {
      throw new BadRequestException('ออกจากทีมเองผ่านช่องทางนี้ไม่ได้');
    }
    this.assertCanManageTarget(actor.role, membership.role);

    await this.prisma.$transaction(async (tx) => {
      await tx.membership.delete({ where: { id: membership.id } });
      // ถ้า workspace ที่ active ของ user คืออันนี้ → เคลียร์ (กัน dangling)
      await tx.user.updateMany({
        where: { id: membership.userId, lastActiveWorkspaceId: workspaceId },
        data: { lastActiveWorkspaceId: null },
      });
    });

    await this.activity.log({
      workspaceId,
      actorId: actor.userId,
      action: ACTIVITY.MEMBER_REMOVE,
      targetType: 'user',
      targetId: targetPublicId,
      metadata: { role: membership.role },
    });
  }

  private async findTargetMembership(workspaceId: bigint, targetPublicId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { workspaceId, user: { publicId: targetPublicId } },
      select: { id: true, role: true, userId: true },
    });
    if (!membership) throw new NotFoundException('ไม่พบสมาชิก');
    return membership;
  }
}
