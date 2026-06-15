import { Injectable } from '@nestjs/common';

import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findByPublicId(publicId: string) {
    return this.usersRepository.findByPublicId(publicId);
  }

  // CRUD/profile ส่วนที่เหลือ — Step 5+
}
