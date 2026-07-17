import { logger, task } from "@trigger.dev/sdk"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"

export type BlogCategory =
  | "buying_guide"
  | "brand_spotlight"
  | "maintenance"
  | "industry_news"
  | "dealership_focused"
  | "lifestyle"

const categoryPrompts: Record<BlogCategory, string> = {
  buying_guide:
    "Write a practical buying guide for South African car buyers. Include tips on financing, test drives, and what to look for.",
  brand_spotlight:
    "Write a detailed spotlight on a specific car brand or model available in South Africa. Cover performance, value, and why it's a good choice.",
  maintenance:
    "Write an educational car maintenance article. Focus on practical tips SA car owners can use to extend their vehicle's life.",
  industry_news:
    "Write about the latest automotive industry news relevant to South Africa — new models, market trends, or regulatory changes.",
  dealership_focused:
    "Write a trust-building article about why buying from a reputable dealership matters. Cover warranties, inspections, and after-sales support.",
  lifestyle:
    "Write an engaging lifestyle article connecting cars to South African life — road trips, family adventures, or weekend getaways.",
}

export const generateBlogPostTask = task({
  id: "generate-blog-post",
  run: async ({
    orgId,
    dealershipName,
    dealershipCity,
    category,
    brand,
    openAiApiKey,
    onPublished,
  }: {
    orgId: string
    dealershipName: string
    dealershipCity?: string
    category: BlogCategory
    brand?: string
    openAiApiKey?: string
    onPublished?: boolean
  }) => {
    const prompt = categoryPrompts[category]
    const cityContext = dealershipCity ? ` in ${dealershipCity}` : ""
    const brandContext = brand ? ` Focus specifically on ${brand} vehicles.` : ""

    const systemPrompt = `You are an automotive SEO content writer for ${dealershipName}${cityContext}, a South African car dealership. Write engaging, informative blog content that helps buyers make informed decisions. Include relevant keywords for South African car buyers.${brandContext}`

    // Generate title and content using LLM
    // For now, use a template-based approach since we may not have direct LLM access
    const now = new Date()
    const title = generateTitle(category, dealershipName, brand)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + now.getTime().toString(36)

    const content = generateContent(category, dealershipName, cityContext, brandContext)

    logger.log(`Generated blog post: "${title}" (${category})`)

    // Save to database
    const [post] = await db
      .insert(blogPosts)
      .values({
        orgId,
        title,
        slug,
        content,
        excerpt: content.substring(0, 160) + "...",
        category,
        tags: generateTags(category, brand),
        author: dealershipName,
        metaDescription: `${title} — ${dealershipName}${cityContext}. ${prompt.substring(0, 100)}`,
        published: false,
      })
      .returning()

    return {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      published: false,
    }
  },
})

function generateTitle(category: BlogCategory, dealershipName: string, brand?: string): string {
  const brandStr = brand ? `${brand} ` : ""
  const titles: Record<BlogCategory, string[]> = {
    buying_guide: [
      `The Ultimate ${brandStr}Buying Guide for South Africans`,
      `How to Choose the Perfect ${brandStr}Vehicle at ${dealershipName}`,
      `${brandStr}Buying Guide: New vs Used — What's Right for You?`,
    ],
    brand_spotlight: [
      `Why ${brandStr}Vehicles Are Taking Over SA Roads`,
      `${brandStr}Review: Performance, Value & Reliability`,
      `Everything You Need to Know About ${brandStr}Cars`,
    ],
    maintenance: [
      `10 Essential ${brandStr}Maintenance Tips for SA Owners`,
      `How to Keep Your ${brandStr}Running Like New`,
      `Seasonal Car Maintenance Guide for South African Drivers`,
    ],
    industry_news: [
      `What's New in the SA Automotive Industry`,
      `Latest ${brandStr}Models Coming to South Africa`,
      `Market Trends: What SA Car Buyers Need to Know`,
    ],
    dealership_focused: [
      `Why Buy from ${dealershipName}? The Trust Advantage`,
      `How We Inspect Every Vehicle at ${dealershipName}`,
      `The ${dealershipName} Guarantee: Quality You Can Trust`,
    ],
    lifestyle: [
      `Top Road Trip Destinations from ${dealershipName}`,
      `The Perfect Family Car for SA Weekend Adventures`,
      `Why ${brandStr}is the Ultimate Lifestyle Vehicle`,
    ],
  }

  const options = titles[category]
  return options[Math.floor(Math.random() * options.length)]
}

function generateContent(
  _category: BlogCategory,
  dealershipName: string,
  cityContext: string,
  brandContext: string
): string {
  return `# ${generateTitle(_category, dealershipName, brandContext ? brandContext.trim() : undefined)}

At **${dealershipName}**${cityContext}, we understand that buying a vehicle is more than a transaction — it's an investment in your freedom, your family's safety, and your daily life.${brandContext}

## Why Choose ${dealershipName}?

As a trusted South African dealership, ${dealershipName} is committed to:
- **Quality Assurance**: Every vehicle passes our comprehensive inspection process
- **Transparent Pricing**: No hidden fees, no surprises
- **After-Sales Support**: We're here for you long after you drive off
- **Finance Made Easy**: Our team helps you navigate financing options

## Our Promise to You

We believe in making car buying simple, transparent, and enjoyable. Whether you're a first-time buyer or a seasoned collector, our team is here to help you find the perfect vehicle.

## Get in Touch

Visit us${cityContext} or contact our sales team to book a test drive. Let us help you find your next vehicle today.

---

*${dealershipName} — Your trusted South African dealership.*
*Rights reserved. T&Cs apply. Prices subject to change without notice.*`
}

function generateTags(category: BlogCategory, brand?: string): string[] {
  const tags: string[] = [category.replace("_", " "), "South Africa", "car dealership"]
  if (brand) tags.push(brand)
  return tags
}

// ── Scheduled task: Weekly content strategy ──
export const weeklyContentStrategyTask = task({
  id: "weekly-content-strategy",
  run: async ({
    orgId,
    dealershipName,
    dealershipCity,
  }: {
    orgId: string
    dealershipName: string
    dealershipCity?: string
  }) => {
    const categories: BlogCategory[] = [
      "buying_guide",
      "brand_spotlight",
      "maintenance",
      "industry_news",
      "dealership_focused",
      "lifestyle",
    ]

    logger.log(`Generating weekly content strategy for ${dealershipName}`)

    // Pick 3 categories for this week
    const weekCategories = categories.sort(() => Math.random() - 0.5).slice(0, 3)

    const results = []
    for (const category of weekCategories) {
      const post = await generateBlogPostTask.trigger({
        orgId,
        dealershipName,
        dealershipCity,
        category,
      })
      results.push({ category, runId: post.id })
    }

    return {
      dealership: dealershipName,
      postsGenerated: results.length,
      categories: results.map((r) => r.category),
    }
  },
})
