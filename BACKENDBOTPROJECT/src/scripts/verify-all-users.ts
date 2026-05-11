import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schema/user.schema';

async function bootstrap() {
  console.log('🚀 Iniciando script de verificación masiva de correos...');

  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const userModel = appContext.get<Model<UserDocument>>(
      getModelToken(User.name),
    );

    console.log('🔍 Buscando usuarios con isEmailVerified: false...');

    // Actualizar todos los usuarios que tengan isEmailVerified en false o que no tengan el campo
    const result = await userModel.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } },
    );

    console.log(`✅ ¡Éxito! Usuarios actualizados: ${result.modifiedCount}`);
    console.log(
      `📊 Total de documentos que coincidieron con el filtro: ${result.matchedCount}`,
    );
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
  } finally {
    await appContext.close();
    console.log('🏁 Proceso finalizado.');
    process.exit(0);
  }
}

bootstrap();
