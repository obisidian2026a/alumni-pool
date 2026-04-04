import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number',
  })
  password!: string;
}
