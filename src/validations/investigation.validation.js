const { z } = require('zod');
const { IndicatorType } = require('@prisma/client');

const startInvestigation = z.object({
  body: z.object({
    indicators: z.array(z.object({
      type: z.nativeEnum(IndicatorType),
      value: z.string().min(1),
    })).min(1, "Au moins un indicateur est requis."),
    caseId: z.string().cuid('ID de dossier invalide.').optional(),
    options: z.object({
        maxGeneration: z.number().int().min(0).max(10).optional(),
        minConfidence: z.number().min(0).max(1).optional(),
    }).optional(),
  }),
});

const getInvestigation = z.object({
    params: z.object({
        id: z.string().cuid('ID d\'investigation invalide.'),
    }),
});

const stopInvestigation = z.object({
    params: z.object({
        id: z.string().cuid('ID d\'investigation invalide.'),
    }),
});

const deleteInvestigation = z.object({
    params: z.object({
        id: z.string().cuid('ID d\'investigation invalide.'),
    }),
});

module.exports = {
  startInvestigation,
  getInvestigation,
  stopInvestigation,
  deleteInvestigation,
};