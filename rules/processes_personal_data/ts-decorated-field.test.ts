// lexcode-expect: 3
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Prop, Schema as NestSchema } from '@nestjs/mongoose';

// TypeORM.
@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  displayName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  dateOfBirth?: Date;
}

// Nest with Mongoose.
@NestSchema()
export class Subscriber {
  @Prop({ required: true })
  email!: string;

  @Prop()
  topic!: string;
}
