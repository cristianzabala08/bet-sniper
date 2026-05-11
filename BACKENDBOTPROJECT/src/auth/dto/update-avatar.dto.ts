import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'Avatar image as a Base64 string or URL',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsString()
  @IsNotEmpty()
  avatar: string;
}
