import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LandingConfig extends Document {
  @Prop({ default: 'Señales con Criterio' })
  heroTitle: string;

  @Prop({ default: 'Potencia tus operaciones con señales profesionales respaldadas por inteligencia artificial y análisis técnico de élite.' })
  heroSubtitle: string;

  @Prop({ default: 'Únete Ahora' })
  heroCtaText: string;

  @Prop({ default: '/auth/register' })
  heroCtaLink: string;

  @Prop({ default: 0 })
  statsWinsToday: number;

  @Prop({ default: 0 })
  statsLossesToday: number;

  @Prop({ default: '0.00' })
  statsProfitToday: string;

  @Prop({ default: '95%' })
  statsWinRate: string;

  @Prop({ default: '+500' })
  statsActiveUsers: string;

  @Prop({ default: 'Nuestro algoritmo usa la estrategia Martingala para maximizar la recuperación tras una pérdida, garantizando que la siguiente operación cubra el déficit anterior.' })
  martingalaDescription: string;

  @Prop({ type: [String], default: ['Análisis técnico avanzado', 'Recuperación inteligente', 'Gestión de riesgo automática', 'Señales en tiempo real'] })
  martingalaFeatures: string[];

  @Prop({ default: '¿Listo para operar con criterio?' })
  ctaSectionTitle: string;

  @Prop({ default: 'Únete a la manada de traders que confían en Bet Sniper.' })
  ctaSectionSubtitle: string;

  @Prop({ default: 'Comenzar Ahora' })
  ctaSectionButtonText: string;

  @Prop({ default: '/auth/register' })
  ctaSectionButtonLink: string;

  @Prop({ default: '© 2025 Bet Sniper. Todos los derechos reservados.' })
  footerText: string;

  @Prop({ default: '' })
  footerDisclaimer: string;

  @Prop({ type: Object, default: { twitter: '', telegram: '', instagram: '', discord: '' } })
  socialLinks: Record<string, string>;
}

export const LandingConfigSchema = SchemaFactory.createForClass(LandingConfig);
