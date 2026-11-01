import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  RotateCcw,
  Check,
  ChevronRight,
  HelpCircle,
  Package,
  Layers,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useCategories, useProducts, useSettings } from "@/lib/db";
import { formatPrice, type CategoryId, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  products?: Product[] | undefined;
  suggestions?: string[] | undefined;
  futureAiNote?: string | undefined;
}

const QUICK_PROMPTS = [
  "✨ Best gifts under ₹3,000",
  "💍 Elegant gold jewellery",
  "⌚ Classic & modern watches",
  "👗 Summer dresses & clothing",
  "📦 How does Cash on Delivery work?",
  "🌿 Home fragrance & decor",
];

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [quizStep, setQuizStep] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{
    cat?: CategoryId | undefined;
    budget?: number | undefined;
    vibe?: string | undefined;
  }>({});
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "m-welcome",
      sender: "assistant",
      text: "Namaste! Welcome to THE VIJAY STORE. I'm your AI Shopping Assistant. How may I assist you today? You can ask for product recommendations, gift ideas, sizes, or delivery details.",
      suggestions: [
        "Find me a gift under ₹2,500",
        "Show me best-selling jewellery",
        "Recommend luxury watches",
        "How does Cash on Delivery work?",
      ],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const products = useProducts();
  const categories = useCategories();
  const settings = useSettings();
  const { add } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Natural assistant thinking delay
    setTimeout(() => {
      const response = processCustomerQuery(query, products, categories, settings);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 450);
  };

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0];
    const err = add({
      productId: product.id,
      qty: 1,
      size: defaultSize,
      color: defaultColor,
    });
    if (err) {
      toast.error(err);
    } else {
      toast.success(`${product.name} added to your cart!`, {
        description: `Cash on Delivery available · ${formatPrice(product.price)}`,
      });
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `m-reset-${Date.now()}`,
        sender: "assistant",
        text: "Conversation refreshed. How can I help you discover our collection today?",
        suggestions: [
          "Show me featured products",
          "What is trending in Jewellery?",
          "Show watches under ₹5,000",
        ],
      },
    ]);
    setQuizStep(null);
    setQuizAnswers({});
  };

  // Preference Quiz helper
  const handleQuizAnswer = (
    key: "cat" | "budget" | "vibe",
    val: CategoryId | number | string | undefined,
  ) => {
    const nextAnswers = { ...quizAnswers, [key]: val };
    setQuizAnswers(nextAnswers);

    if (quizStep === 1) {
      setQuizStep(2);
    } else if (quizStep === 2) {
      setQuizStep(null);
      // Run search based on answers
      let filtered = products.filter((p) => p.active);
      if (nextAnswers.cat) {
        filtered = filtered.filter((p) => p.category === nextAnswers.cat);
      }
      if (nextAnswers.budget) {
        filtered = filtered.filter((p) => p.price <= nextAnswers.budget!);
      }
      const matched = filtered.slice(0, 4);

      setMessages((prev) => [
        ...prev,
        {
          id: `quiz-res-${Date.now()}`,
          sender: "assistant",
          text: `Based on your preference for ${nextAnswers.cat ? categories.find((c) => c.id === nextAnswers.cat)?.name : "our collection"} ${nextAnswers.budget ? `under ${formatPrice(nextAnswers.budget)}` : ""}, here are hand-picked recommendations for you:`,
          products: matched,
          suggestions: [
            "Show more in this price range",
            "Show matching accessories",
            "Clear filters",
          ],
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-gold/40 bg-primary px-4 py-3 text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 hover:border-gold hover:shadow-gold/20",
          isOpen ? "bg-card text-foreground border-border" : "animate-bounce-subtle",
        )}
        aria-label="Open AI Shopping Assistant"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
        </span>
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-xs font-medium tracking-wide">
          {isOpen ? "Close Assistant" : "AI Assistant"}
        </span>
      </button>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Shopping Assistant"
          className="fixed bottom-20 right-4 z-50 flex h-[580px] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 sm:bottom-24 sm:right-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-gold border border-gold/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Vijay Store Assistant
                  </h3>
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  36 products indexed • Instant search
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Restart conversation"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                aria-label="Reset chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Capability Note */}
          <div className="flex items-center justify-between bg-gold/10 px-3.5 py-1.5 text-[10px] text-gold border-b border-gold/20">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>Smart Catalog Assistant (Client-side AI)</span>
            </span>
            <span className="text-[9px] opacity-75">Gemini Ready</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col text-sm",
                  m.sender === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed",
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
                      : "bg-secondary/70 text-foreground rounded-bl-none border border-border/60",
                  )}
                >
                  <p className="whitespace-pre-line text-xs sm:text-sm">{m.text}</p>
                </div>

                {/* Optional Future AI upgrade notice badge */}
                {m.futureAiNote && (
                  <p className="mt-1 text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-gold" /> {m.futureAiNote}
                  </p>
                )}

                {/* Embedded Product Recommendations */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-3 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-2.5 shadow-sm hover:border-gold transition-colors"
                      >
                        <div className="flex gap-2.5">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-16 w-16 rounded-lg object-cover border border-border"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-gold font-medium">
                              {p.category}
                            </p>
                            <Link
                              to="/product/$id"
                              params={{ id: p.id }}
                              onClick={() => setIsOpen(false)}
                              className="font-medium text-xs leading-snug line-clamp-2 hover:text-gold"
                            >
                              {p.name}
                            </Link>
                            <p className="mt-1 font-semibold text-xs text-foreground">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-border/60">
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock <= 0}
                            className="flex-1 rounded-md bg-primary py-1.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="h-3 w-3" />
                            {p.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </button>
                          <Link
                            to="/product/$id"
                            params={{ id: p.id }}
                            onClick={() => setIsOpen(false)}
                            className="rounded-md border border-input p-1.5 text-[10px] hover:border-gold hover:text-gold transition-colors"
                            title="View product details"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Suggestion Chips */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSend(sug)}
                        className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/15 transition-colors text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Interactive Preference Finder Banner / Quiz */}
            {quizStep === null && (
              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-gold" /> Style & Gift Finder
                  </span>
                  <button
                    onClick={() => setQuizStep(1)}
                    className="text-[11px] text-gold font-medium hover:underline flex items-center gap-1"
                  >
                    Start Quiz <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Need inspiration? Answer 2 quick questions to find your curated matches.
                </p>
              </div>
            )}

            {/* Quiz Step 1: Category */}
            {quizStep === 1 && (
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs space-y-2.5 animate-in fade-in">
                <p className="font-semibold text-foreground">
                  Step 1: What category are you exploring?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleQuizAnswer("cat", c.id)}
                      className="rounded-lg border border-border bg-card p-2 text-left hover:border-gold text-xs transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    onClick={() => handleQuizAnswer("cat", undefined)}
                    className="col-span-2 rounded-lg border border-dashed border-border p-1.5 text-center text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    Show all categories
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Step 2: Budget */}
            {quizStep === 2 && (
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs space-y-2.5 animate-in fade-in">
                <p className="font-semibold text-foreground">
                  Step 2: What is your preferred budget?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Under ₹2,000", max: 2000 },
                    { label: "Under ₹4,000", max: 4000 },
                    { label: "Under ₹7,000", max: 7000 },
                    { label: "Any Budget", max: 50000 },
                  ].map((b) => (
                    <button
                      key={b.label}
                      onClick={() => handleQuizAnswer("budget", b.max)}
                      className="rounded-lg border border-border bg-card p-2 text-left hover:border-gold text-xs transition-colors"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                  <Sparkles className="h-3 w-3 text-gold animate-spin" />
                </div>
                <span>Scanning 36 products...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Carousel */}
          <div className="border-t border-border/80 bg-secondary/30 px-3 py-2 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p.replace(/^[^\s]+\s/, ""))}
                className="inline-block rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gold hover:text-foreground transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, styles, budget, COD..."
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:border-gold"
              aria-label="Ask assistant"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-gold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/**
 * Intelligent Catalog Processing Engine.
 * Runs completely locally with zero external paid APIs, parsing customer intents,
 * extracting budget limits, matching categories, and identifying matching items.
 */
function processCustomerQuery(
  rawQuery: string,
  products: Product[],
  categories: { id: CategoryId; name: string }[],
  settings: { freeDeliveryThreshold: number; standardFee: number; expressFee: number },
): Message {
  const q = rawQuery.toLowerCase();
  const id = `resp-${Date.now()}`;

  // 1. Policy & Service queries
  if (q.includes("cod") || q.includes("cash on delivery") || q.includes("payment")) {
    return {
      id,
      sender: "assistant",
      text: "Yes! THE VIJAY STORE offers **Cash on Delivery (COD)** on all orders across India.\n\n• No advance payment or card required.\n• Pay in cash or scan UPI QR directly to the courier agent upon doorstep delivery.\n• Instant order confirmation.",
      suggestions: ["What is the delivery fee?", "Show all available jewellery", "View watches"],
    };
  }

  if (
    q.includes("delivery") ||
    q.includes("shipping") ||
    q.includes("charge") ||
    q.includes("free")
  ) {
    return {
      id,
      sender: "assistant",
      text: `We offer reliable pan-India delivery:\n\n• **Standard Delivery**: Free on all orders over ${formatPrice(settings.freeDeliveryThreshold)} (otherwise ${formatPrice(settings.standardFee)}).\n• **Express Delivery**: ${formatPrice(settings.expressFee)} for accelerated dispatch.\n• Delivery timeline is typically 3-5 business days with Cash on Delivery.`,
      suggestions: ["Show gifts under ₹2,000", "Show watches", "Shop all products"],
    };
  }

  if (q.includes("return") || q.includes("exchange") || q.includes("refund")) {
    return {
      id,
      sender: "assistant",
      text: "We offer a 7-day hassle-free return and exchange policy on all eligible unworn items with original tags and packaging intact. Contact our support team for an instant pickup request.",
      suggestions: ["Contact support", "Check my orders", "Continue shopping"],
    };
  }

  // 2. Budget extraction
  let budgetMax: number | undefined;
  const underMatch = q.match(
    /(?:under|below|less than|within|max)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i,
  );
  if (underMatch && underMatch[1]) {
    budgetMax = Number(underMatch[1].replace(/,/g, ""));
  }

  // 3. Category matching
  let matchedCat: CategoryId | undefined;
  if (
    q.includes("jewel") ||
    q.includes("earring") ||
    q.includes("necklace") ||
    q.includes("ring") ||
    q.includes("gold") ||
    q.includes("pearl") ||
    q.includes("pendant")
  ) {
    matchedCat = "jewellery";
  } else if (
    q.includes("watch") ||
    q.includes("timepiece") ||
    q.includes("chronograph") ||
    q.includes("strap")
  ) {
    matchedCat = "watches";
  } else if (
    q.includes("cloth") ||
    q.includes("dress") ||
    q.includes("shirt") ||
    q.includes("linen") ||
    q.includes("silk") ||
    q.includes("jacket") ||
    q.includes("blazer") ||
    q.includes("wear")
  ) {
    matchedCat = "clothing";
  } else if (
    q.includes("home") ||
    q.includes("candle") ||
    q.includes("decor") ||
    q.includes("throw") ||
    q.includes("diffuser") ||
    q.includes("cushion")
  ) {
    matchedCat = "home";
  } else if (
    q.includes("beauty") ||
    q.includes("serum") ||
    q.includes("cream") ||
    q.includes("skincare") ||
    q.includes("lipstick") ||
    q.includes("perfume")
  ) {
    matchedCat = "beauty";
  } else if (
    q.includes("accessor") ||
    q.includes("wallet") ||
    q.includes("bag") ||
    q.includes("scarf") ||
    q.includes("sunglass") ||
    q.includes("belt")
  ) {
    matchedCat = "accessories";
  }

  // 4. Specific product search
  const directProduct = products.find(
    (p) => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(q),
  );

  if (directProduct && q.length > 5) {
    return {
      id,
      sender: "assistant",
      text: `Here are the details for **${directProduct.name}**:\n\n• Price: **${formatPrice(directProduct.price)}**\n• Stock: ${directProduct.stock > 0 ? `${directProduct.stock} available in stock` : "Currently out of stock"}\n• Sizes: ${directProduct.sizes.length ? directProduct.sizes.join(", ") : "Standard / One-size"}\n• Colours: ${directProduct.colors.length ? directProduct.colors.join(", ") : "As pictured"}\n• Description: ${directProduct.description}`,
      products: [directProduct],
      suggestions: [
        `Add ${directProduct.name} to cart`,
        `More from ${categories.find((c) => c.id === directProduct.category)?.name}`,
        "Show similar products",
      ],
      futureAiNote: "Advanced feature: Connect Gemini API for multimodal photo search.",
    };
  }

  // 5. Gift / Occasion queries
  if (
    q.includes("gift") ||
    q.includes("anniversary") ||
    q.includes("birthday") ||
    q.includes("wedding")
  ) {
    let giftCandidates = products.filter(
      (p) =>
        p.active && (p.tags.includes("featured") || p.collection === "gifting" || p.price >= 1500),
    );
    if (budgetMax) giftCandidates = giftCandidates.filter((p) => p.price <= budgetMax!);
    if (matchedCat) giftCandidates = giftCandidates.filter((p) => p.category === matchedCat);

    const picks = giftCandidates.slice(0, 4);
    return {
      id,
      sender: "assistant",
      text: `For a special gift${budgetMax ? ` within ${formatPrice(budgetMax)}` : ""}, I recommend our signature curated pieces featuring luxury gift-ready packaging and Cash on Delivery:`,
      products: picks,
      suggestions: ["Under ₹2,000 gifts", "Jewellery gifts", "Watches for gifting"],
      futureAiNote: "Future upgrade: Connect Gemini API for recipient persona analysis.",
    };
  }

  // 6. Filter pool based on category, budget, and term
  let candidates = products.filter((p) => p.active);

  if (matchedCat) {
    candidates = candidates.filter((p) => p.category === matchedCat);
  }

  if (budgetMax) {
    candidates = candidates.filter((p) => p.price <= budgetMax!);
  }

  // Term matching
  const words = q
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["the", "and", "for", "with", "show", "give", "recommend", "under", "below"].includes(w),
    );
  if (words.length > 0) {
    const scored = candidates.map((p) => {
      let score = 0;
      const text =
        `${p.name} ${p.description} ${p.category} ${p.colors.join(" ")} ${p.sizes.join(" ")}`.toLowerCase();
      for (const w of words) {
        if (text.includes(w)) score += 2;
      }
      if (p.tags.includes("featured")) score += 1;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    candidates = scored.filter((x) => x.score > 0).map((x) => x.p);
  }

  const results = candidates.slice(0, 4);

  if (results.length > 0) {
    const catName = matchedCat ? categories.find((c) => c.id === matchedCat)?.name : null;
    return {
      id,
      sender: "assistant",
      text: `Here are ${results.length} recommended items${catName ? ` in ${catName}` : ""}${budgetMax ? ` under ${formatPrice(budgetMax)}` : ""}:`,
      products: results,
      suggestions: [
        catName ? `More ${catName}` : "Explore Jewellery",
        "Filter under ₹3,000",
        "View cart",
      ],
      futureAiNote: "Future AI Connection: Real-time neural re-ranking powered by Gemini.",
    };
  }

  // Fallback featured recommendations
  const fallback = products.filter((p) => p.active && p.featured).slice(0, 4);
  return {
    id,
    sender: "assistant",
    text: `I couldn't find an exact match for "${rawQuery}", but here are our best-selling featured pieces from THE VIJAY STORE that our customers love:`,
    products: fallback,
    suggestions: ["Show all Jewellery", "Show Watches", "Show Clothing", "Gifts under ₹2,000"],
  };
}
