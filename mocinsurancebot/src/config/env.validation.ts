import { plainToClass } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  PORT: number;

  @IsString()
  DF_AUTH_HEADER: string;

  @IsString()
  GLIA_KEY_ID: string;

  @IsString()
  GLIA_KEY_SECRET: string;

  @IsString()
  GLIA_SITE_ID: string;

  @IsString()
  GLIA_TEAM_ID: string;

  @IsString()
  OUTLOOK_TENANT: string;

  @IsString()
  OUTLOOK_CLIENT_ID: string;

  @IsString()
  OUTLOOK_SECRET: string;

  @IsString()
  OUTLOOK_USER_ID: string;

  @IsString()
  ZOOM_LINK: string;

  @IsString()
  ZOOM_MEETING_ID: string;

  @IsString()
  ZOOM_MEETING_PASS: string;

  @IsNumber()
  WORKING_HOURS_START: number;

  @IsNumber()
  WORKING_HOURS_END: number;

  @IsString()
  AGENT_TIME_ZONE: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = [
      errors.toString(),
      ...errors.map((err) => err.constraints?.matches).filter(Boolean),
    ];

    throw new Error(messages.join('\n'));
  }
  return validatedConfig;
}
