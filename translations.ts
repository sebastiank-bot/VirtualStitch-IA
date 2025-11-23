

import { ViewType } from './types';

export const translations = {
  en: {
    header: {
      title: "VirtualStitch AI",
      poweredBy: "Powered by Gemini 2.5 Flash",
      model: "Flash Image Model",
      undo: "Undo",
      redo: "Redo",
      clearAll: "Reset App"
    },
    upload: {
      step1: "Upload References",
      personLabel: "Model Reference",
      personSubLabel: "The Person",
      personDescLabel: "Model Description (Optional)",
      personPlaceholder: "E.g., Young Asian woman, long dark hair, standing pose...",
      heightLabel: "Height (cm)",
      weightLabel: "Weight (kg)",
      recommendedSize: "Recommended Size",
      
      outfitSectionTitle: "Apparel References",
      addGarment: "Add Another Garment",
      garmentLabel: "Garment",
      garmentDescLabel: "Description",
      garmentPlaceholder: "E.g., Blue denim jeans, slim fit...",
      
      clearPerson: "Clear Person",
      clearGarments: "Clear Garments",
      
      dragDrop: "Click, paste, or drag & drop",
      fileType: "JPEG, PNG, WEBP up to 5MB",
      remove: "Remove"
    },
    config: {
      step2: "Configuration",
      targetViews: "Target Views",
      customPromptLabel: "Custom Prompt / Style",
      customPromptPlaceholder: "E.g., Cyberpunk aesthetic, neon lighting, vintage 90s magazine style...",
      qualityLabel: "Image Resolution (Ignored in Flash)",
      qualityStandard: "Standard",
      qualityHigh: "High Res",
      qualityUltra: "Ultra",
      generateBtn: "Generate Virtual Try-On",
      generatingBtn: "Stitching Reality...",
      errors: {
        missingFiles: "Please upload a person reference and at least one garment.",
        missingDesc: "Please provide a description for all garments.",
        missingView: "Select at least one view type.",
        unexpected: "An unexpected error occurred."
      },
      viewTypes: {
        [ViewType.FRONT]: 'Full Body Frontal',
        [ViewType.SIDE]: 'Side Profile / 45 Degree',
        [ViewType.CLOSEUP]: 'Detailed Upper Body',
        [ViewType.LIFESTYLE]: 'Candid Lifestyle Shot'
      }
    },
    gallery: {
      emptyTitle: "No designs generated yet",
      emptyDesc: "Upload references and click Generate to see magic.",
      title: "Generated Collection",
      items: "items",
      designing: "Designing...",
      stitching: "Stitching inputs together",
      close: "Close",
      download: "Download",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      reset: "Reset",
      stylistTitle: "Mía's Opinion",
      stylistRole: "Image Consultant",
      animate: "Animate (Veo)",
      generatingVideo: "Generating Video...",
      playVideo: "Play Video"
    },
    analysis: {
      title: "Size Recommendation",
      subtitle: "Based on input metrics"
    }
  },
  es: {
    header: {
      title: "VirtualStitch AI",
      poweredBy: "Impulsado por Gemini 2.5 Flash",
      model: "Modelo Flash Image",
      undo: "Deshacer",
      redo: "Rehacer",
      clearAll: "Reiniciar App"
    },
    upload: {
      step1: "Subir Referencias",
      personLabel: "Referencia del Modelo",
      personSubLabel: "La Persona",
      personDescLabel: "Descripción del Modelo (Opcional)",
      personPlaceholder: "Ej: Mujer joven asiática, cabello largo y oscuro, de pie...",
      heightLabel: "Altura (cm)",
      weightLabel: "Peso (kg)",
      recommendedSize: "Talla Recomendada",
      
      outfitSectionTitle: "Referencias de Vestuario",
      addGarment: "Agregar Otra Prenda",
      garmentLabel: "Prenda",
      garmentDescLabel: "Descripción",
      garmentPlaceholder: "Ej: Jeans de mezclilla azul, corte ajustado...",
      
      clearPerson: "Borrar Persona",
      clearGarments: "Borrar Prendas",

      dragDrop: "Clic, pegar o arrastrar",
      fileType: "JPEG, PNG, WEBP hasta 5MB",
      remove: "Eliminar"
    },
    config: {
      step2: "Configuración",
      targetViews: "Vistas Objetivo",
      customPromptLabel: "Prompt Personalizado / Estilo",
      customPromptPlaceholder: "Ej: Estética cyberpunk, iluminación neón, estilo revista vintage de los 90...",
      qualityLabel: "Resolución (Ignorada en Flash)",
      qualityStandard: "Estándar",
      qualityHigh: "Alta Res",
      qualityUltra: "Ultra",
      generateBtn: "Generar Prueba Virtual",
      generatingBtn: "Procesando Realidad...",
      errors: {
        missingFiles: "Sube una referencia de persona y al menos una prenda.",
        missingDesc: "Proporciona descripción para todas las prendas.",
        missingView: "Selecciona al menos un tipo de vista.",
        unexpected: "Ocurrió un error inesperado."
      },
      viewTypes: {
        [ViewType.FRONT]: 'Cuerpo Completo Frontal',
        [ViewType.SIDE]: 'Perfil Lateral / 45 Grados',
        [ViewType.CLOSEUP]: 'Plano Detallado Superior',
        [ViewType.LIFESTYLE]: 'Estilo de Vida Casual'
      }
    },
    gallery: {
      emptyTitle: "Aún no hay diseños generados",
      emptyDesc: "Sube referencias y haz clic en Generar para ver la magia.",
      title: "Colección Generada",
      items: "ítems",
      designing: "Diseñando...",
      stitching: "Uniendo entradas",
      close: "Cerrar",
      download: "Descargar",
      zoomIn: "Acercar",
      zoomOut: "Alejar",
      reset: "Restaurar",
      stylistTitle: "La Opinión de Mía",
      stylistRole: "Asesora de Imagen",
      animate: "Animar (Veo)",
      generatingVideo: "Generando Video...",
      playVideo: "Ver Video"
    },
    analysis: {
      title: "Recomendación de Talla",
      subtitle: "Basado en métricas ingresadas"
    }
  },
  pt: {
    header: {
      title: "VirtualStitch AI",
      poweredBy: "Desenvolvido por Gemini 2.5 Flash",
      model: "Modelo Flash Image",
      undo: "Desfazer",
      redo: "Refazer",
      clearAll: "Reiniciar App"
    },
    upload: {
      step1: "Carregar Referências",
      personLabel: "Referência do Modelo",
      personSubLabel: "A Pessoa",
      personDescLabel: "Descrição do Modelo (Opcional)",
      personPlaceholder: "Ex: Mulher jovem asiática, cabelo escuro longo, em pé...",
      heightLabel: "Altura (cm)",
      weightLabel: "Peso (kg)",
      recommendedSize: "Tamanho Recomendado",
      
      outfitSectionTitle: "Referências de Vestuário",
      addGarment: "Adicionar Outra Peça",
      garmentLabel: "Peça",
      garmentDescLabel: "Descrição",
      garmentPlaceholder: "Ex: Jeans azul, corte justo...",
      
      clearPerson: "Limpar Pessoa",
      clearGarments: "Limpar Roupas",

      dragDrop: "Clique, cole ou arraste",
      fileType: "JPEG, PNG, WEBP até 5MB",
      remove: "Remover"
    },
    config: {
      step2: "Configuração",
      targetViews: "Vistas Alvo",
      customPromptLabel: "Prompt Personalizado / Estilo",
      customPromptPlaceholder: "Ex: Estética cyberpunk, iluminação neon, estilo revista anos 90...",
      qualityLabel: "Resolução (Ignorada no Flash)",
      qualityStandard: "Padrão",
      qualityHigh: "Alta Res",
      qualityUltra: "Ultra",
      generateBtn: "Gerar Provador Virtual",
      generatingBtn: "Processando Realidade...",
      errors: {
        missingFiles: "Carregue uma referência da pessoa e pelo menos uma peça de roupa.",
        missingDesc: "Forneça descrição para todas as peças.",
        missingView: "Selecione pelo menos um tipo de vista.",
        unexpected: "Ocorreu um erro inesperado."
      },
      viewTypes: {
        [ViewType.FRONT]: 'Corpo Inteiro Frontal',
        [ViewType.SIDE]: 'Perfil Lateral / 45 Graus',
        [ViewType.CLOSEUP]: 'Detalhe Superior',
        [ViewType.LIFESTYLE]: 'Estilo de Vida Casual'
      }
    },
    gallery: {
      emptyTitle: "Nenhum design gerado ainda",
      emptyDesc: "Carregue referências e clique em Gerar para ver a mágica.",
      title: "Coleção Gerada",
      items: "itens",
      designing: "Projetando...",
      stitching: "Unindo as entradas",
      close: "Fechar",
      download: "Baixar",
      zoomIn: "Zoom +",
      zoomOut: "Zoom -",
      reset: "Resetar",
      stylistTitle: "Opinião da Mía",
      stylistRole: "Consultora de Imagem",
      animate: "Animar (Veo)",
      generatingVideo: "Gerando Vídeo...",
      playVideo: "Ver Vídeo"
    },
    analysis: {
      title: "Recomendação de Tamanho",
      subtitle: "Com base nas métricas"
    }
  }
};