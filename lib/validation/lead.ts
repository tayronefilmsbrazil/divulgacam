import { z } from 'zod';

export const leadSchema = z.object({
  nome: z
    .string({ required_error: 'Informe seu nome.' })
    .trim()
    .min(2, 'Nome muito curto.')
    .max(120, 'Nome muito longo.'),
  whatsapp: z
    .string({ required_error: 'Informe seu WhatsApp.' })
    .regex(
      /^\(\d{2}\) 9\d{4}-\d{4}$/,
      'Formato esperado: (82) 9XXXX-XXXX'
    ),
  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('')),
  tipo_participacao: z.enum(['apoiador', 'colaborador', 'lideranca'], {
    required_error: 'Selecione como você quer participar.',
  }),
  campanha_id: z.string().uuid('campanha_id inválido.'),
});

export type LeadInput = z.infer<typeof leadSchema>;
