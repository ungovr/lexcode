// lexcode-expect: 0
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Prop, Schema as NestSchema } from '@nestjs/mongoose';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ default: false })
  archived!: boolean;
}

@NestSchema()
export class Tag {
  @Prop({ required: true })
  label!: string;

  @Prop()
  displayName!: string;
}

// A class that holds an email without a persistence decorator: a plain data holder.
export class MailJob {
  email!: string;
  subject!: string;
}

export class Settings {
  readonly supportEmail = 'help@example.org';
}
