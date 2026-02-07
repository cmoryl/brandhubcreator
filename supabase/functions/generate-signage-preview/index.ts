import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferenceImage {
  data: string; // Base64 data or URL
  type: 'design' | 'booth-reference' | 'venue-reference'; // Purpose of the reference
  name?: string;
}

interface TemplateReference {
  data: string; // Base64 data
  type: string; // MIME type
  name: string;
}

interface SignagePreviewRequest {
  signageType: string;
  signageName: string;
  dimensions: string;
  brandName?: string;
  brandColors?: string[];
  style?: 'photorealistic' | 'mockup' | 'venue';
  referenceImage?: string; // Base64 image for image-to-image generation (legacy/main design)
  referenceImages?: ReferenceImage[]; // Multiple reference images for better context
  templateReference?: TemplateReference; // PDF or image template reference
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signageType, signageName, dimensions, brandName, brandColors, style = 'photorealistic', referenceImage, referenceImages, templateReference } = await req.json() as SignagePreviewRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt for hyper-realistic signage imagery
    const colorDescription = brandColors?.length 
      ? `using brand colors: ${brandColors.slice(0, 3).join(', ')}` 
      : '';
    
    const brandContext = brandName ? `for "${brandName}"` : '';
    
    const signageDescriptions: Record<string, string> = {
      'booth-backdrop': 'large trade show booth backdrop wall with lighting',
      'pull-up-banner': 'professional roll-up retractable banner stand',
      'table-banner': 'table throw cover or table top display',
      'hanging-sign': 'overhead hanging banner or sign suspended from ceiling',
      'floor-graphic': 'floor decal or floor standing display',
      'directional': 'wayfinding or directional signage arrow',
      'podium-sign': 'podium graphic or lectern branding',
      'stage-backdrop': 'large stage backdrop with professional lighting',
      'outdoor-banner': 'outdoor vinyl banner or flag',
      'other': 'professional event signage display',
    };

    const signageDesc = signageDescriptions[signageType] || signageDescriptions['other'];
    
    const stylePrompts: Record<string, string> = {
      'photorealistic': 'Ultra photorealistic render, professional photography, soft studio lighting, shallow depth of field, high-end commercial shoot',
      'mockup': 'Clean product mockup on white background, studio lighting, minimal shadows, template-style presentation',
      'venue': 'In realistic venue setting, convention center or event space, natural lighting, people blur in background, authentic trade show atmosphere',
    };

    // Build message content based on available inputs
    let prompt: string;
    const messageContent: any[] = [];
    
    // Template reference context
    const templateContext = templateReference 
      ? `Use the provided booth template/layout reference to ensure accurate proportions, structure, and placement of design elements. Match the template's booth configuration precisely.`
      : '';

    // Determine if we have reference images (new multi-image or legacy single image)
    const hasDesignImage = referenceImage || referenceImages?.some(img => img.type === 'design');
    const boothReferences = referenceImages?.filter(img => img.type === 'booth-reference') || [];
    const venueReferences = referenceImages?.filter(img => img.type === 'venue-reference') || [];
    
    // Build context about reference images
    const referenceContext = [];
    if (boothReferences.length > 0) {
      referenceContext.push(`Use the ${boothReferences.length} booth reference image(s) to understand the physical booth structure, layout, and how signage integrates into the space.`);
    }
    if (venueReferences.length > 0) {
      referenceContext.push(`Use the ${venueReferences.length} venue reference image(s) to understand the environment, lighting, and atmosphere where the booth will be placed.`);
    }
    const referenceDescription = referenceContext.length > 0 ? referenceContext.join(' ') : '';

    // CRITICAL RULE: Never generate text or logos in the output
    const noTextRule = `
CRITICAL RULE - DO NOT ADD TEXT OR LOGOS:
- NEVER add any text, words, letters, numbers, or typography to the generated image
- NEVER add any logos, brand marks, symbols, or icons
- NEVER add any signage titles, labels, or captions
- The booth/signage surfaces should show abstract patterns, colors, or gradients ONLY
- If the reference image contains text/logos, render those surfaces as clean abstract visuals instead
- This is a visualization of the physical booth structure, NOT the final branded design`;

    if (hasDesignImage) {
      // Image-to-image: enhance the uploaded booth photo
      prompt = `Transform this booth/signage design into a professional ${style} preview image.
Keep the core design and branding elements from the uploaded design image, but render it as if it's a real physical booth at an event.
${stylePrompts[style]}

The signage is "${signageName}" (${signageDesc}) with dimensions ${dimensions} ${brandContext} ${colorDescription}.
${templateContext}
${referenceDescription}
${noTextRule}

IMPORTANT: 
- The first/main image is the design that should be rendered onto the booth/signage
- Use additional reference images to understand booth structure and venue context
- Make it look polished, professional, and hyper-realistic
- Preserve the exact branding, logos, and design elements from the original
- Show realistic materials, lighting, shadows, and depth
16:9 aspect ratio, 4K quality, commercial photography style.`;
    } else {
      // Text-to-image: generate from scratch (possibly with template reference)
      prompt = `Generate a hyper-realistic preview image of a ${signageDesc} ${brandContext}. 
The signage is named "${signageName}" with dimensions ${dimensions} ${colorDescription}.
${stylePrompts[style]}
${templateContext}
${referenceDescription}
${noTextRule}
Show the signage from a professional viewing angle, as if photographed at a real event or trade show.
Make it look like a high-quality professional photograph, not an illustration.
16:9 aspect ratio, 4K quality, commercial photography style.`;
    }

    // Add text prompt first
    messageContent.push({
      type: "text",
      text: prompt,
    });

    // Add reference image if provided (legacy single image - main design)
    if (referenceImage) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: referenceImage,
        },
      });
    }

    // Add multiple reference images if provided (new multi-image support)
    if (referenceImages && referenceImages.length > 0) {
      // Add design images first (most important)
      for (const refImg of referenceImages.filter(img => img.type === 'design')) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: refImg.data,
          },
        });
      }
      // Then booth references
      for (const refImg of referenceImages.filter(img => img.type === 'booth-reference')) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: refImg.data,
          },
        });
      }
      // Then venue references
      for (const refImg of referenceImages.filter(img => img.type === 'venue-reference')) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: refImg.data,
          },
        });
      }
    }

    // Add template reference if provided (image only - PDFs need different handling)
    if (templateReference && templateReference.type.startsWith('image/')) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: templateReference.data,
        },
      });
    }

    // For PDF templates, we include a note in the prompt since direct PDF input isn't supported
    if (templateReference && templateReference.type === 'application/pdf') {
      // Update prompt to note the PDF reference
      messageContent[0] = {
        type: "text",
        text: prompt + `\n\nNote: A PDF template "${templateReference.name}" has been provided as reference. Generate based on typical booth configurations for this type of signage.`,
      };
    }

    console.log('[generate-signage-preview] Generating for:', signageName, signageType, 
      referenceImage ? '(with reference image)' : '(from scratch)',
      templateReference ? `(with ${templateReference.type} template)` : '(no template)');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[generate-signage-preview] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    console.log('[generate-signage-preview] Successfully generated image');

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        prompt: prompt.substring(0, 200) + '...',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-signage-preview] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate preview" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
