#!/usr/bin/env python3
import os
import subprocess
from PIL import Image

OUT_DIR = "store-assets"
TMP_DIR = "/tmp/livia_assets"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

# Common SVG Defs for Livia Branding
COMMON_DEFS = """
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgCanvas" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020908" />
      <stop offset="40%" stop-color="#061914" />
      <stop offset="100%" stop-color="#020807" />
    </linearGradient>
    
    <radialGradient id="meshEmerald" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.32" />
      <stop offset="50%" stop-color="#0d9488" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#020908" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="meshTeal" cx="80%" cy="70%" r="55%">
      <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.28" />
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#020908" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091815" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#05120f" stop-opacity="0.95" />
    </linearGradient>

    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#14b8a6" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0.5" />
    </linearGradient>

    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#a7f3d0" />
      <stop offset="100%" stop-color="#2dd4bf" />
    </linearGradient>

    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#064e3b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f766e" stop-opacity="0.8" />
    </linearGradient>

    <!-- Logo Gradients -->
    <linearGradient id="ribbonStem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a7f3d0" />
      <stop offset="50%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="ribbonLoop" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#5eead4" />
    </linearGradient>
    <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#2dd4bf" />
    </linearGradient>

    <!-- Glow Filters -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>
"""

def make_logo_symbol(scale=1.0, x=0, y=0):
    return f"""
    <g transform="translate({x}, {y}) scale({scale})">
      <rect x="0" y="0" width="80" height="80" rx="20" fill="#061f1a" stroke="url(#cardBorder)" stroke-width="1.5" />
      <path d="M 24 24 C 24 21, 27 19, 30 19 C 33 19, 35 21, 35 24 L 35 52 C 35 57, 39 61, 44 61 L 60 61 C 63 61, 65 63, 65 65 C 65 67, 63 69, 60 69 L 42 69 C 32 69, 24 61, 24 51 Z" fill="url(#ribbonStem)" />
      <path d="M 28 44 C 31 38, 38 34, 46 34 C 55 34, 62 40, 64 49 C 65 52, 63 54, 60 54 C 58 54, 56 52, 55 50 C 53 45, 49 42, 44 42 C 39 42, 34 45, 32 49 Z" fill="url(#ribbonLoop)" />
      <!-- Star Spark -->
      <path d="M 60 20 C 60.5 24, 64 24.5, 68 25 C 64 25.5, 60.5 26, 60 30 C 59.5 26, 56 25.5, 52 25 C 56 24.5, 59.5 24, 60 20 Z" fill="url(#sparkGrad)" filter="url(#softGlow)" />
    </g>
    """

def make_browser_bar(width, title="https://theverge.com/ai/article-understanding"):
    return f"""
    <!-- Browser Top Bar -->
    <rect x="0" y="0" width="{width}" height="42" rx="14" fill="#0d1f1c" />
    <circle cx="20" cy="21" r="5.5" fill="#ef4444" opacity="0.8" />
    <circle cx="38" cy="21" r="5.5" fill="#f59e0b" opacity="0.8" />
    <circle cx="56" cy="21" r="5.5" fill="#10b981" opacity="0.8" />
    <!-- Omnibox -->
    <rect x="80" y="8" width="{width - 160}" height="26" rx="6" fill="#061412" stroke="#10b981" stroke-opacity="0.2" />
    <text x="96" y="25" fill="#6ee7b7" font-size="11" font-family="system-ui, -apple-system, sans-serif" opacity="0.85">🔒 {title}</text>
    """

# -------------------------------------------------------------
# 1. MARQUEE BANNER (1400 x 560 px)
# -------------------------------------------------------------
def get_marquee_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
{COMMON_DEFS}
  <!-- Background -->
  <rect width="1400" height="560" fill="url(#bgCanvas)" />
  <rect width="1400" height="560" fill="url(#meshEmerald)" />
  <rect width="1400" height="560" fill="url(#meshTeal)" />

  <!-- Grid overlay -->
  <g opacity="0.06" stroke="#10b981" stroke-width="1">
    <line x1="0" y1="140" x2="1400" y2="140" />
    <line x1="0" y1="280" x2="1400" y2="280" />
    <line x1="0" y1="420" x2="1400" y2="420" />
    <line x1="280" y1="0" x2="280" y2="560" />
    <line x1="560" y1="0" x2="560" y2="560" />
    <line x1="840" y1="0" x2="840" y2="560" />
    <line x1="1120" y1="0" x2="1120" y2="560" />
  </g>

  <!-- Left Content Column -->
  <g transform="translate(80, 80)">
    <!-- Pill Badge -->
    <rect x="0" y="0" width="310" height="34" rx="17" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" stroke-width="1.2" />
    <circle cx="18" cy="17" r="5" fill="#34d399" filter="url(#softGlow)" />
    <text x="32" y="22" fill="#d1fae5" font-size="12" font-weight="700" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1">100% PRIVATE • BYOK ARCHITECTURE</text>

    <!-- Main Headline -->
    <text x="0" y="95" fill="url(#textGrad)" font-size="46" font-weight="800" font-family="system-ui, -apple-system, 'SF Pro Display', sans-serif" letter-spacing="-0.5">Meet Livia</text>
    <text x="0" y="145" fill="#ffffff" font-size="34" font-weight="700" font-family="system-ui, -apple-system, sans-serif">Your Private AI Web Copilot</text>

    <!-- Subtitle -->
    <text x="0" y="195" fill="#94a3b8" font-size="16" font-family="system-ui, -apple-system, sans-serif" font-weight="400">
      <tspan x="0" dy="0">Instant translation, context explanation &amp; smart summarization</tspan>
      <tspan x="0" dy="26">on any webpage. Zero subscriptions. Direct to your favorite AI.</tspan>
    </text>

    <!-- Feature Tags -->
    <g transform="translate(0, 260)">
      <rect x="0" y="0" width="120" height="32" rx="8" fill="#06241e" stroke="#10b981" stroke-opacity="0.3" />
      <text x="14" y="20" fill="#a7f3d0" font-size="12" font-weight="600" font-family="system-ui, sans-serif">⚡ Ultra Fast</text>

      <rect x="132" y="0" width="132" height="32" rx="8" fill="#06241e" stroke="#10b981" stroke-opacity="0.3" />
      <text x="146" y="20" fill="#a7f3d0" font-size="12" font-weight="600" font-family="system-ui, sans-serif">🔒 Zero Server</text>

      <rect x="276" y="0" width="140" height="32" rx="8" fill="#06241e" stroke="#10b981" stroke-opacity="0.3" />
      <text x="290" y="20" fill="#a7f3d0" font-size="12" font-weight="600" font-family="system-ui, sans-serif">✨ Multi-Model</text>
    </g>

    <!-- Model Badges -->
    <g transform="translate(0, 320)">
      <text x="0" y="14" fill="#64748b" font-size="11" font-weight="700" font-family="system-ui, sans-serif" letter-spacing="1">POWERED BY DIRECT APIS:</text>
      <g transform="translate(0, 26)">
        <rect x="0" y="0" width="105" height="26" rx="6" fill="#0a1d19" stroke="#1e3a34" />
        <text x="12" y="17" fill="#cbd5e1" font-size="11" font-weight="600" font-family="system-ui, sans-serif">Google Gemini</text>

        <rect x="115" y="0" width="80" height="26" rx="6" fill="#0a1d19" stroke="#1e3a34" />
        <text x="127" y="17" fill="#cbd5e1" font-size="11" font-weight="600" font-family="system-ui, sans-serif">OpenAI</text>

        <rect x="205" y="0" width="120" height="26" rx="6" fill="#0a1d19" stroke="#1e3a34" />
        <text x="217" y="17" fill="#cbd5e1" font-size="11" font-weight="600" font-family="system-ui, sans-serif">Claude Sonnet</text>

        <rect x="335" y="0" width="95" height="26" rx="6" fill="#0a1d19" stroke="#1e3a34" />
        <text x="347" y="17" fill="#cbd5e1" font-size="11" font-weight="600" font-family="system-ui, sans-serif">OpenRouter</text>
      </g>
    </g>
  </g>

  <!-- Right Visual Mockup (Floating UI Showcase) -->
  <g transform="translate(760, 60)" filter="url(#boxShadow)">
    <!-- Browser Card Window -->
    <rect x="0" y="0" width="560" height="430" rx="16" fill="url(#cardGrad)" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(560)}

    <!-- Web Page Article Mockup -->
    <g transform="translate(32, 64)">
      <rect x="0" y="0" width="380" height="12" rx="4" fill="#1e3a34" />
      <rect x="0" y="22" width="496" height="8" rx="4" fill="#0f2b25" />
      <rect x="0" y="38" width="460" height="8" rx="4" fill="#0f2b25" />
      
      <!-- Highlighted Selection on Webpage -->
      <rect x="0" y="58" width="480" height="22" rx="4" fill="#047857" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.4" />
      <text x="8" y="74" fill="#ecfdf5" font-size="12" font-family="system-ui, sans-serif" font-weight="500">"Artificial general intelligence requires seamless on-demand alignment..."</text>
    </g>

    <!-- Livia Capsule Floating Toolbar -->
    <g transform="translate(110, 160)" filter="url(#softGlow)">
      <rect x="0" y="0" width="340" height="44" rx="22" fill="#051c16" stroke="#34d399" stroke-width="1.5" />
      <!-- Livia Brand Mark inside Toolbar -->
      <circle cx="24" cy="22" r="13" fill="#09382f" stroke="#10b981" stroke-width="1" />
      <text x="19" y="27" fill="#34d399" font-size="12" font-weight="900" font-family="sans-serif">L</text>
      
      <!-- Action buttons -->
      <g transform="translate(48, 6)">
        <rect x="0" y="0" width="64" height="32" rx="16" fill="#10b981" fill-opacity="0.25" stroke="#34d399" stroke-width="1" />
        <text x="12" y="21" fill="#ecfdf5" font-size="12" font-weight="600" font-family="sans-serif">文A Dịch</text>

        <rect x="70" y="0" width="70" height="32" rx="16" fill="#0a251f" />
        <text x="82" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">✍️ Viết lại</text>

        <rect x="146" y="0" width="70" height="32" rx="16" fill="#0a251f" />
        <text x="158" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">📄 Tóm tắt</text>

        <rect x="222" y="0" width="60" height="32" rx="16" fill="#0a251f" />
        <text x="232" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">💡 ELI5</text>
      </g>
    </g>

    <!-- Livia AI Result Popover Window -->
    <g transform="translate(48, 224)" filter="url(#boxShadow)">
      <rect x="0" y="0" width="464" height="180" rx="14" fill="#041813" stroke="url(#cardBorder)" stroke-width="1.2" />
      
      <!-- Popover Header -->
      <g transform="translate(16, 12)">
        <circle cx="10" cy="10" r="10" fill="#064e3b" />
        <text x="6" y="14" fill="#34d399" font-size="11" font-weight="900">L</text>
        <text x="28" y="14" fill="#ffffff" font-size="13" font-weight="700" font-family="sans-serif">Livia</text>
        <circle cx="70" cy="10" r="3" fill="#10b981" />
        <text x="78" y="14" fill="#6ee7b7" font-size="11" font-family="sans-serif">Gemini 1.5 Flash</text>

        <!-- Right actions -->
        <rect x="360" y="2" width="60" height="20" rx="4" fill="#0d3129" />
        <text x="368" y="16" fill="#a7f3d0" font-size="10" font-weight="600" font-family="sans-serif">✓ Đã sao chép</text>
      </g>
      <line x1="16" y1="38" x2="448" y2="38" stroke="#133d34" stroke-width="1" />

      <!-- Result Text Content -->
      <g transform="translate(16, 52)">
        <text x="0" y="14" fill="#34d399" font-size="11" font-weight="700" font-family="sans-serif">BẢN DỊCH TIẾNG VIỆT:</text>
        <text x="0" y="36" fill="#f1f5f9" font-size="13" font-weight="500" font-family="system-ui, sans-serif">
          "Trí tuệ nhân tạo tổng quát đòi hỏi sự căn chỉnh liền mạch theo ngữ cảnh thực tế..."
        </text>
        
        <rect x="0" y="52" width="432" height="34" rx="6" fill="#07221c" stroke="#134e42" stroke-dasharray="3 3" />
        <text x="10" y="73" fill="#a7f3d0" font-size="11" font-family="system-ui, sans-serif">💡 Ngữ cảnh: Thuật ngữ "alignment" ở đây nhấn mạnh tính an toàn và hướng theo ý muốn người dùng.</text>
      </g>
    </g>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 2. SMALL PROMO TILE (440 x 280 px)
# -------------------------------------------------------------
def get_promo_tile_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
{COMMON_DEFS}
  <!-- Background -->
  <rect width="440" height="280" fill="url(#bgCanvas)" />
  <rect width="440" height="280" fill="url(#meshEmerald)" />
  <rect width="440" height="280" fill="url(#meshTeal)" />

  <!-- Center Card -->
  <rect x="20" y="20" width="400" height="240" rx="18" fill="url(#cardGrad)" stroke="url(#cardBorder)" stroke-width="1.5" filter="url(#boxShadow)" />

  <!-- Livia Icon -->
  {make_logo_symbol(scale=1.1, x=172, y=42)}

  <!-- Brand Typography -->
  <text x="220" y="162" text-anchor="middle" fill="url(#textGrad)" font-size="28" font-weight="800" font-family="system-ui, -apple-system, 'SF Pro Display', sans-serif" letter-spacing="-0.5">Livia</text>
  <text x="220" y="186" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="600" font-family="system-ui, sans-serif">Private AI Copilot &amp; Web Assistant</text>

  <!-- Tagline Badges -->
  <g transform="translate(56, 204)">
    <rect x="0" y="0" width="96" height="24" rx="6" fill="#062e26" stroke="#10b981" stroke-opacity="0.3" />
    <text x="10" y="16" fill="#a7f3d0" font-size="10" font-weight="700" font-family="sans-serif">100% PRIVATE</text>

    <rect x="106" y="0" width="110" height="24" rx="6" fill="#062e26" stroke="#10b981" stroke-opacity="0.3" />
    <text x="116" y="16" fill="#a7f3d0" font-size="10" font-weight="700" font-family="sans-serif">BYOK NO FEES</text>

    <rect x="226" y="0" width="102" height="24" rx="6" fill="#062e26" stroke="#10b981" stroke-opacity="0.3" />
    <text x="236" y="16" fill="#a7f3d0" font-size="10" font-weight="700" font-family="sans-serif">MULTI-MODEL</text>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 3. SCREENSHOT 1: HERO OVERVIEW (1280 x 800 px)
# -------------------------------------------------------------
def get_screenshot_1_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
{COMMON_DEFS}
  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bgCanvas)" />
  <rect width="1280" height="800" fill="url(#meshEmerald)" />
  <rect width="1280" height="800" fill="url(#meshTeal)" />

  <!-- Top Showcase Header -->
  <g transform="translate(0, 52)" text-anchor="middle">
    <!-- Tag -->
    <rect x="520" y="0" width="240" height="32" rx="16" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" />
    <text x="640" y="21" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif" letter-spacing="1">ALL-IN-ONE AI ASSISTANT</text>

    <!-- Main Title -->
    <text x="640" y="74" fill="url(#textGrad)" font-size="38" font-weight="800" font-family="system-ui, -apple-system, sans-serif">Meet Livia: Your Smartest On-Page AI Copilot</text>
    <text x="640" y="106" fill="#94a3b8" font-size="16" font-family="sans-serif">Select any text on any page for instant translation, explanation, and rewriting.</text>
  </g>

  <!-- Big Realistic Browser Window Mockup -->
  <g transform="translate(100, 185)" filter="url(#boxShadow)">
    <rect x="0" y="0" width="1080" height="570" rx="16" fill="#071814" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(1080, "https://nature.com/articles/ai-neuroscience-breakthroughs")}

    <!-- Web Page Mock Content -->
    <g transform="translate(60, 70)">
      <!-- Article Header -->
      <text x="0" y="32" fill="#e2e8f0" font-size="24" font-weight="700" font-family="system-ui, sans-serif">Neural Plasticity and In-Context Reasoning in LLMs</text>
      <text x="0" y="58" fill="#64748b" font-size="13" font-family="sans-serif">By Dr. Elena Vance • Published in Nature Technology • 5 min read</text>
      <line x1="0" y1="74" x2="960" y2="74" stroke="#16382f" stroke-width="1" />

      <!-- Paragraphs -->
      <g transform="translate(0, 96)">
        <text x="0" y="20" fill="#94a3b8" font-size="14" font-family="system-ui, sans-serif" line-height="24">
          <tspan x="0" dy="0">Recent advances in transformer architectures demonstrate that in-context learning behaves remarkably like biological neural plasticity.</tspan>
          <tspan x="0" dy="26">By analyzing activations across attention heads, researchers discovered transient dynamic sub-circuits capable of rapid meta-adaptation.</tspan>
        </text>

        <!-- Selected Text Highlight -->
        <g transform="translate(0, 68)">
          <rect x="0" y="0" width="880" height="54" rx="6" fill="#047857" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.4" />
          <text x="12" y="24" fill="#ecfdf5" font-size="14" font-weight="600" font-family="system-ui, sans-serif">
            "These transient neural configurations allow models to synthesize unprecedented algorithmic strategies on-the-fly,"
          </text>
          <text x="12" y="44" fill="#ecfdf5" font-size="14" font-weight="600" font-family="system-ui, sans-serif">
            "effectively bypassing the rigid constraints of static parameter weights."
          </text>
        </g>
      </g>
    </g>

    <!-- Floating Toolbar Capsule -->
    <g transform="translate(340, 240)" filter="url(#softGlow)">
      <rect x="0" y="0" width="400" height="46" rx="23" fill="#051e18" stroke="#34d399" stroke-width="1.8" />
      <circle cx="26" cy="23" r="14" fill="#0a3d33" stroke="#10b981" stroke-width="1" />
      <text x="21" y="28" fill="#34d399" font-size="13" font-weight="900" font-family="sans-serif">L</text>

      <g transform="translate(56, 7)">
        <rect x="0" y="0" width="76" height="32" rx="16" fill="#10b981" fill-opacity="0.3" stroke="#34d399" stroke-width="1" />
        <text x="14" y="21" fill="#ecfdf5" font-size="12" font-weight="700" font-family="sans-serif">文A Dịch</text>

        <rect x="84" y="0" width="80" height="32" rx="16" fill="#0a2922" />
        <text x="96" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">✍️ Viết lại</text>

        <rect x="172" y="0" width="80" height="32" rx="16" fill="#0a2922" />
        <text x="184" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">📝 Tóm tắt</text>

        <rect x="260" y="0" width="80" height="32" rx="16" fill="#0a2922" />
        <text x="272" y="21" fill="#99f6e4" font-size="12" font-family="sans-serif">💡 Giải thích</text>
      </g>
    </g>

    <!-- Floating Result Modal -->
    <g transform="translate(240, 310)" filter="url(#boxShadow)">
      <rect x="0" y="0" width="600" height="230" rx="16" fill="#041914" stroke="url(#cardBorder)" stroke-width="1.5" />
      
      <!-- Modal Header -->
      <g transform="translate(20, 16)">
        <circle cx="12" cy="12" r="12" fill="#0a3d33" stroke="#10b981" />
        <text x="8" y="16" fill="#34d399" font-size="12" font-weight="900">L</text>
        <text x="32" y="17" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif">Livia Copilot</text>
        <circle cx="132" cy="12" r="3.5" fill="#10b981" filter="url(#softGlow)" />
        <text x="142" y="16" fill="#6ee7b7" font-size="12" font-family="sans-serif">Gemini 1.5 Flash • 0.3s</text>

        <!-- Copy Button -->
        <rect x="470" y="0" width="86" height="26" rx="6" fill="#0d3a30" stroke="#10b981" stroke-width="1" />
        <text x="484" y="17" fill="#a7f3d0" font-size="11" font-weight="600" font-family="sans-serif">✓ Sao chép</text>
      </g>
      <line x1="20" y1="46" x2="580" y2="46" stroke="#153e34" />

      <!-- Modal Body -->
      <g transform="translate(24, 64)">
        <text x="0" y="16" fill="#34d399" font-size="12" font-weight="700" font-family="sans-serif">KẾT QUẢ DỊCH VÀ GIẢI NGHĨA:</text>
        <text x="0" y="42" fill="#f8fafc" font-size="14" font-weight="500" font-family="system-ui, sans-serif">
          "Cấu hình nơ-ron tạm thời này cho phép mô hình tự tổng hợp các chiến lược thuật toán tức thì chưa từng có, vượt qua các giới hạn cứng nhắc của trọng số tĩnh."
        </text>

        <!-- Context Pill Box -->
        <g transform="translate(0, 72)">
          <rect x="0" y="0" width="552" height="42" rx="8" fill="#072b22" stroke="#145244" />
          <text x="14" y="25" fill="#a7f3d0" font-size="12" font-family="system-ui, sans-serif">
            🔍 Thuật ngữ: <tspan fill="#ffffff" font-weight="600">"on-the-fly"</tspan> có nghĩa là xử lý động ngay trong lúc chạy, không cần qua bước huấn luyện lại.
          </text>
        </g>
      </g>
    </g>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 4. SCREENSHOT 2: INSTANT TRANSLATION (1280 x 800 px)
# -------------------------------------------------------------
def get_screenshot_2_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
{COMMON_DEFS}
  <rect width="1280" height="800" fill="url(#bgCanvas)" />
  <rect width="1280" height="800" fill="url(#meshEmerald)" />
  <rect width="1280" height="800" fill="url(#meshTeal)" />

  <!-- Header -->
  <g transform="translate(0, 52)" text-anchor="middle">
    <rect x="490" y="0" width="300" height="32" rx="16" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" />
    <text x="640" y="21" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif" letter-spacing="1">CROSS-LANGUAGE INTELLIGENCE</text>
    <text x="640" y="74" fill="url(#textGrad)" font-size="38" font-weight="800" font-family="system-ui, -apple-system, sans-serif">Understand Any Language In One Click</text>
    <text x="640" y="106" fill="#94a3b8" font-size="16" font-family="sans-serif">Nuanced contextual translations with grammar breakdown and native fluency.</text>
  </g>

  <!-- Dual Comparison Card Showcase -->
  <g transform="translate(100, 170)" filter="url(#boxShadow)">
    <rect x="0" y="0" width="1080" height="580" rx="16" fill="#071814" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(1080, "https://asia.nikkei.com/business/tech/semiconductor-advances")}

    <!-- Split View: Source vs Livia Translation -->
    <g transform="translate(48, 64)">
      <!-- Left: Japanese Original -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="470" height="430" rx="12" fill="#041511" stroke="#16382f" />
        <g transform="translate(24, 20)">
          <text x="0" y="16" fill="#64748b" font-size="12" font-weight="700" font-family="sans-serif">SOURCE TEXT (JAPANESE)</text>
          <text x="0" y="52" fill="#e2e8f0" font-size="18" font-weight="600" font-family="sans-serif">次世代半導体製造プロセスの革新</text>
          <text x="0" y="90" fill="#94a3b8" font-size="14" font-family="sans-serif" line-height="24">
            <tspan x="0" dy="0">極端紫外線（EUV）露光技術の進化に伴い、</tspan>
            <tspan x="0" dy="24">2ナノメートル以下の微細化プロセスにおける歩留まり向上が</tspan>
            <tspan x="0" dy="24">最重要課題となっています。日本および台湾の共同研究チームは、</tspan>
            <tspan x="0" dy="24">新たな高分子レジスト材料を開発し、回路欠陥を40%削減することに成功しました。</tspan>
          </text>
          
          <rect x="0" y="240" width="422" height="130" rx="8" fill="#09241e" />
          <text x="16" y="28" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif">📌 Vocabulary &amp; Grammar Highlights:</text>
          <text x="16" y="56" fill="#cbd5e1" font-size="12" font-family="sans-serif">• 歩留まり (Budomari): Tỷ lệ thành phẩm đạt chuẩn (Yield rate)</text>
          <text x="16" y="80" fill="#cbd5e1" font-size="12" font-family="sans-serif">• 極端紫外線 (EUV): Ánh sáng cực tím siêu ngắn</text>
          <text x="16" y="104" fill="#cbd5e1" font-size="12" font-family="sans-serif">• 微細化 (Bisaika): Thu nhỏ quy trình bán dẫn (Miniaturization)</text>
        </g>
      </g>

      <!-- Center Arrow Indicator -->
      <g transform="translate(485, 200)" filter="url(#softGlow)">
        <circle cx="20" cy="20" r="24" fill="#064e3b" stroke="#34d399" stroke-width="2" />
        <path d="M 12 20 L 26 20 M 20 14 L 26 20 L 20 26" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Right: Livia Fluent Translation (Vietnamese) -->
      <g transform="translate(520, 0)">
        <rect x="0" y="0" width="464" height="430" rx="12" fill="#041a15" stroke="url(#cardBorder)" stroke-width="1.5" />
        <g transform="translate(24, 20)">
          <!-- Status -->
          <circle cx="6" cy="10" r="4" fill="#10b981" />
          <text x="18" y="14" fill="#34d399" font-size="12" font-weight="700" font-family="sans-serif">LIVIA TRANSLATION • VIETNAMESE</text>

          <text x="0" y="52" fill="#ffffff" font-size="18" font-weight="700" font-family="sans-serif">Đột Phá Trong Quy Trình Sản Xuất Bán Dẫn Thế Hệ Mới</text>
          
          <text x="0" y="90" fill="#ecfdf5" font-size="14" font-weight="500" font-family="sans-serif" line-height="24">
            <tspan x="0" dy="0">Cùng với sự phát triển của kỹ thuật quang khắc tia cực tím (EUV),</tspan>
            <tspan x="0" dy="24">việc nâng cao tỷ lệ thành phẩm (yield rate) trong tiến trình thu nhỏ</tspan>
            <tspan x="0" dy="24">dưới 2 nanomet đang là bài toán sống còn. Đội ngũ nghiên cứu hợp tác</tspan>
            <tspan x="0" dy="24">Nhật Bản – Đài Loan đã chế tạo thành công vật liệu chất cản quang polyme mới,</tspan>
            <tspan x="0" dy="24">giúp giảm 40% lỗi vi mạch.</tspan>
          </text>

          <!-- Accuracy Badge -->
          <g transform="translate(0, 240)">
            <rect x="0" y="0" width="416" height="50" rx="8" fill="#06382c" stroke="#10b981" stroke-opacity="0.4" />
            <text x="16" y="24" fill="#6ee7b7" font-size="12" font-weight="700" font-family="sans-serif">✓ Chuẩn xác 100% Thuật ngữ Bán dẫn &amp; Kỹ thuật</text>
            <text x="16" y="40" fill="#94a3b8" font-size="11" font-family="sans-serif">Hỗ trợ song ngữ tức thì với Gemini 1.5, Claude 3.5 Sonnet &amp; GPT-4o</text>
          </g>

          <!-- Action buttons -->
          <g transform="translate(0, 310)">
            <rect x="0" y="0" width="130" height="34" rx="8" fill="#10b981" fill-opacity="0.2" stroke="#34d399" stroke-width="1" />
            <text x="20" y="22" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif">📋 Sao chép</text>

            <rect x="144" y="0" width="140" height="34" rx="8" fill="#092821" />
            <text x="160" y="22" fill="#a7f3d0" font-size="12" font-family="sans-serif">🔄 Đổi ngôn ngữ</text>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 5. SCREENSHOT 3: ARTICLE SUMMARIZER (1280 x 800 px)
# -------------------------------------------------------------
def get_screenshot_3_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
{COMMON_DEFS}
  <rect width="1280" height="800" fill="url(#bgCanvas)" />
  <rect width="1280" height="800" fill="url(#meshEmerald)" />
  <rect width="1280" height="800" fill="url(#meshTeal)" />

  <!-- Header -->
  <g transform="translate(0, 52)" text-anchor="middle">
    <rect x="500" y="0" width="280" height="32" rx="16" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" />
    <text x="640" y="21" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif" letter-spacing="1">FULL PAGE INTELLIGENCE</text>
    <text x="640" y="74" fill="url(#textGrad)" font-size="38" font-weight="800" font-family="system-ui, -apple-system, sans-serif">Read 10x Faster with Article Summarizer</text>
    <text x="640" y="106" fill="#94a3b8" font-size="16" font-family="sans-serif">Powered by Mozilla Readability. Extract the core points from 10,000-word articles in seconds.</text>
  </g>

  <!-- Browser Container Mockup -->
  <g transform="translate(140, 175)" filter="url(#boxShadow)">
    <rect x="0" y="0" width="1000" height="570" rx="16" fill="#071814" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(1000, "https://bloomberg.com/news/macro-economic-shifts-2026")}

    <!-- Reading Mode Summary Modal -->
    <g transform="translate(80, 56)">
      <rect x="0" y="0" width="840" height="470" rx="14" fill="#041b16" stroke="url(#cardBorder)" stroke-width="1.2" />

      <!-- Summary Modal Header -->
      <g transform="translate(32, 24)">
        <circle cx="16" cy="16" r="16" fill="#073b30" stroke="#10b981" />
        <text x="11" y="21" fill="#34d399" font-size="14" font-weight="900">L</text>
        <text x="44" y="21" fill="#ffffff" font-size="16" font-weight="700" font-family="sans-serif">Livia • Tóm tắt nội dung trang</text>
        
        <rect x="290" y="6" width="140" height="24" rx="12" fill="#06382c" stroke="#10b981" stroke-opacity="0.3" />
        <text x="304" y="22" fill="#6ee7b7" font-size="11" font-weight="600" font-family="sans-serif">⏱ Tiết kiệm 12 phút đọc</text>

        <!-- Right Quick Actions -->
        <rect x="680" y="4" width="86" height="28" rx="6" fill="#10b981" fill-opacity="0.25" stroke="#34d399" stroke-width="1" />
        <text x="696" y="22" fill="#a7f3d0" font-size="12" font-weight="600" font-family="sans-serif">📋 Sao chép</text>
      </g>
      <line x1="32" y1="64" x2="808" y2="64" stroke="#154237" />

      <!-- Summary Content -->
      <g transform="translate(32, 84)">
        <!-- Article Title Tag -->
        <text x="0" y="20" fill="#94a3b8" font-size="13" font-family="sans-serif">BÀI VIẾT GỐC: <tspan fill="#ffffff" font-weight="600">Báo cáo kinh tế vĩ mô toàn cầu &amp; chu kỳ thanh khoản 2026</tspan></text>

        <!-- Key Takeaways Bullets -->
        <g transform="translate(0, 48)">
          <!-- Bullet 1 -->
          <circle cx="8" cy="10" r="5" fill="#34d399" />
          <text x="24" y="14" fill="#ecfdf5" font-size="14" font-weight="600" font-family="sans-serif">
            1. Dòng vốn chuyển dịch mạnh mẽ sang hạ tầng AI và năng lượng sạch:
          </text>
          <text x="24" y="34" fill="#cbd5e1" font-size="13" font-family="sans-serif">
            Các tập đoàn công nghệ phân bổ trên 250 tỷ USD cho trung tâm dữ liệu và lưới điện thế hệ mới.
          </text>

          <!-- Bullet 2 -->
          <circle cx="8" cy="68" r="5" fill="#34d399" />
          <text x="24" y="72" fill="#ecfdf5" font-size="14" font-weight="600" font-family="sans-serif">
            2. Chính sách tiền tệ bước vào chu kỳ nới lỏng chọn lọc:
          </text>
          <text x="24" y="92" fill="#cbd5e1" font-size="13" font-family="sans-serif">
            Các ngân hàng trung ương ưu tiên kiểm soát lạm phát dịch vụ đồng thời hỗ trợ tăng trưởng công nghệ cao.
          </text>

          <!-- Bullet 3 -->
          <circle cx="8" cy="126" r="5" fill="#34d399" />
          <text x="24" y="130" fill="#ecfdf5" font-size="14" font-weight="600" font-family="sans-serif">
            3. Rủi ro đứt gãy chuỗi cung ứng giảm đáng kể:
          </text>
          <text x="24" y="150" fill="#cbd5e1" font-size="13" font-family="sans-serif">
            Chiến lược đa dạng hóa sản xuất tại Đông Nam Á (Việt Nam, Malaysia) phát huy hiệu quả thực tế.
          </text>

          <!-- Bullet 4 -->
          <circle cx="8" cy="184" r="5" fill="#34d399" />
          <text x="24" y="188" fill="#ecfdf5" font-size="14" font-weight="600" font-family="sans-serif">
            4. Khuyến nghị hành động chiến lược:
          </text>
          <text x="24" y="208" fill="#cbd5e1" font-size="13" font-family="sans-serif">
            Tập trung bảo toàn biên lợi nhuận, tái cấu trúc chi phí điện toán đám mây và chủ động phòng ngừa rủi ro tỷ giá.
          </text>
        </g>

        <!-- ELI5 Switcher Button -->
        <g transform="translate(0, 310)">
          <rect x="0" y="0" width="220" height="38" rx="8" fill="#073026" stroke="#10b981" stroke-width="1.2" />
          <text x="24" y="24" fill="#a7f3d0" font-size="13" font-weight="600" font-family="sans-serif">🧒 Đổi sang Giải thích ELI5</text>

          <rect x="236" y="0" width="180" height="38" rx="8" fill="#04231b" stroke="#13473b" />
          <text x="256" y="24" fill="#a7f3d0" font-size="13" font-family="sans-serif">💬 Hỏi đáp với trang này</text>
        </g>
      </g>
    </g>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 6. SCREENSHOT 4: WRITING & POLISHER (1280 x 800 px)
# -------------------------------------------------------------
def get_screenshot_4_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
{COMMON_DEFS}
  <rect width="1280" height="800" fill="url(#bgCanvas)" />
  <rect width="1280" height="800" fill="url(#meshEmerald)" />
  <rect width="1280" height="800" fill="url(#meshTeal)" />

  <!-- Header -->
  <g transform="translate(0, 52)" text-anchor="middle">
    <rect x="490" y="0" width="300" height="32" rx="16" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" />
    <text x="640" y="21" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif" letter-spacing="1">AI INLINE WRITING COMPANION</text>
    <text x="640" y="74" fill="url(#textGrad)" font-size="38" font-weight="800" font-family="system-ui, -apple-system, sans-serif">Write Better, Smarter &amp; Faster</text>
    <text x="640" y="106" fill="#94a3b8" font-size="16" font-family="sans-serif">Polish tone, fix grammar and compose high-impact emails directly inside your text fields.</text>
  </g>

  <!-- Browser with Email Editor Mockup -->
  <g transform="translate(100, 175)" filter="url(#boxShadow)">
    <rect x="0" y="0" width="1080" height="570" rx="16" fill="#071814" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(1080, "https://mail.google.com/mail/u/0/#inbox/compose")}

    <!-- Email Compose Window Mockup -->
    <g transform="translate(64, 60)">
      <rect x="0" y="0" width="952" height="460" rx="12" fill="#041612" stroke="#16382f" />
      
      <!-- Email Header Fields -->
      <g transform="translate(24, 20)">
        <text x="0" y="16" fill="#64748b" font-size="13" font-family="sans-serif">To: <tspan fill="#e2e8f0">partnerships@globaltech.com</tspan></text>
        <line x1="0" y1="28" x2="904" y2="28" stroke="#0e2b24" />

        <text x="0" y="52" fill="#64748b" font-size="13" font-family="sans-serif">Subject: <tspan fill="#ffffff" font-weight="600">Strategic Collaboration Proposal — Q4 2026</tspan></text>
        <line x1="0" y1="66" x2="904" y2="66" stroke="#0e2b24" />
      </g>

      <!-- Raw text drafted by user -->
      <g transform="translate(24, 110)">
        <text x="0" y="16" fill="#94a3b8" font-size="14" font-family="sans-serif">Hi Alex,</text>
        <text x="0" y="42" fill="#94a3b8" font-size="14" font-family="sans-serif">
          I am writing to you because our team wants to partner with your team on the new project.
        </text>
        
        <!-- Highlighted section -->
        <rect x="0" y="58" width="800" height="28" rx="4" fill="#047857" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.4" />
        <text x="8" y="77" fill="#ecfdf5" font-size="14" font-family="sans-serif">
          We think we can make a lot of synergy together and help clients solve their problem fast.
        </text>
      </g>

      <!-- Livia Writing Suggestions Popover -->
      <g transform="translate(180, 200)" filter="url(#boxShadow)">
        <rect x="0" y="0" width="620" height="230" rx="14" fill="#041a15" stroke="url(#cardBorder)" stroke-width="1.5" />
        
        <!-- Header -->
        <g transform="translate(20, 16)">
          <circle cx="12" cy="12" r="12" fill="#08382e" stroke="#10b981" />
          <text x="8" y="16" fill="#34d399" font-size="12" font-weight="900">L</text>
          <text x="32" y="17" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif">Livia • Viết lại chuyên nghiệp</text>
          
          <rect x="470" y="0" width="120" height="26" rx="6" fill="#10b981" />
          <text x="484" y="17" fill="#022c22" font-size="12" font-weight="700" font-family="sans-serif">⚡ Thay thế ngay</text>
        </g>
        <line x1="20" y1="46" x2="600" y2="46" stroke="#153e34" />

        <!-- Options -->
        <g transform="translate(20, 64)">
          <!-- Option A: Executive & Professional -->
          <rect x="0" y="0" width="580" height="64" rx="8" fill="#082c23" stroke="#10b981" stroke-width="1.2" />
          <text x="14" y="22" fill="#34d399" font-size="11" font-weight="700" font-family="sans-serif">TÙY CHỌN 1: EXECUTIVE &amp; PERSUASIVE (KHUYÊN DÙNG)</text>
          <text x="14" y="44" fill="#ecfdf5" font-size="13" font-weight="500" font-family="sans-serif">
            "By combining our specialized core capabilities, we can accelerate time-to-value for enterprise clients."
          </text>

          <!-- Option B: Friendly & Collaborative -->
          <rect x="0" y="74" width="580" height="56" rx="8" fill="#04201a" stroke="#13473b" />
          <text x="14" y="96" fill="#94a3b8" font-size="11" font-weight="700" font-family="sans-serif">TÙY CHỌN 2: CONCISE &amp; DIRECT</text>
          <text x="14" y="118" fill="#cbd5e1" font-size="13" font-family="sans-serif">
            "A collaborative effort between our teams will streamline client delivery and maximize impact."
          </text>
        </g>
      </g>
    </g>
  </g>
</svg>
"""

# -------------------------------------------------------------
# 7. SCREENSHOT 5: 100% PRIVATE BYOK (1280 x 800 px)
# -------------------------------------------------------------
def get_screenshot_5_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
{COMMON_DEFS}
  <rect width="1280" height="800" fill="url(#bgCanvas)" />
  <rect width="1280" height="800" fill="url(#meshEmerald)" />
  <rect width="1280" height="800" fill="url(#meshTeal)" />

  <!-- Header -->
  <g transform="translate(0, 52)" text-anchor="middle">
    <rect x="490" y="0" width="300" height="32" rx="16" fill="url(#pillGrad)" stroke="#34d399" stroke-opacity="0.4" />
    <text x="640" y="21" fill="#a7f3d0" font-size="12" font-weight="700" font-family="sans-serif" letter-spacing="1">ZERO MIDDLEMAN • MAXIMUM PRIVACY</text>
    <text x="640" y="74" fill="url(#textGrad)" font-size="38" font-weight="800" font-family="system-ui, -apple-system, sans-serif">100% Private BYOK Architecture</text>
    <text x="640" y="106" fill="#94a3b8" font-size="16" font-family="sans-serif">Bring Your Own Key. Zero subscriptions. Your API keys are stored 100% locally in your browser.</text>
  </g>

  <!-- Options Dashboard Window Mockup -->
  <g transform="translate(140, 175)" filter="url(#boxShadow)">
    <rect x="0" y="0" width="1000" height="570" rx="16" fill="#071814" stroke="url(#cardBorder)" stroke-width="1.5" />
    {make_browser_bar(1000, "chrome-extension://livia/options.html")}

    <g transform="translate(60, 60)">
      <!-- Sidebar Navigation -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="220" height="430" rx="12" fill="#041612" stroke="#14362d" />
        
        <!-- App Title in Sidebar -->
        <g transform="translate(20, 24)">
          <circle cx="16" cy="16" r="16" fill="#073b30" stroke="#10b981" />
          <text x="11" y="21" fill="#34d399" font-size="14" font-weight="900">L</text>
          <text x="44" y="21" fill="#ffffff" font-size="16" font-weight="800" font-family="sans-serif">Livia</text>
          <text x="44" y="34" fill="#10b981" font-size="10" font-weight="700" font-family="sans-serif">SETTINGS VAULT</text>
        </g>
        <line x1="20" y1="72" x2="200" y2="72" stroke="#12382e" />

        <!-- Nav Items -->
        <g transform="translate(16, 90)">
          <!-- Active Nav -->
          <rect x="0" y="0" width="188" height="38" rx="8" fill="#08382c" stroke="#10b981" stroke-width="1" />
          <text x="16" y="24" fill="#a7f3d0" font-size="13" font-weight="700" font-family="sans-serif">🔑 AI Providers (BYOK)</text>

          <rect x="0" y="48" width="188" height="38" rx="8" fill="none" />
          <text x="16" y="72" fill="#94a3b8" font-size="13" font-family="sans-serif">⚡ Custom Actions</text>

          <rect x="0" y="96" width="188" height="38" rx="8" fill="none" />
          <text x="16" y="120" fill="#94a3b8" font-size="13" font-family="sans-serif">🌐 Languages &amp; Fonts</text>

          <rect x="0" y="144" width="188" height="38" rx="8" fill="none" />
          <text x="16" y="168" fill="#94a3b8" font-size="13" font-family="sans-serif">🛡️ Security &amp; Privacy</text>
        </g>

        <!-- Privacy Callout at bottom of Sidebar -->
        <g transform="translate(16, 320)">
          <rect x="0" y="0" width="188" height="90" rx="8" fill="#03201a" stroke="#0e4437" />
          <text x="12" y="24" fill="#34d399" font-size="11" font-weight="700" font-family="sans-serif">🔒 Zero-Server Guarantee</text>
          <text x="12" y="44" fill="#94a3b8" font-size="10" font-family="sans-serif">Calls route directly</text>
          <text x="12" y="58" fill="#94a3b8" font-size="10" font-family="sans-serif">from browser to AI provider.</text>
          <text x="12" y="74" fill="#6ee7b7" font-size="10" font-weight="600" font-family="sans-serif">No middleman ever.</text>
        </g>
      </g>

      <!-- Main Config Panel -->
      <g transform="translate(244, 0)">
        <rect x="0" y="0" width="636" height="430" rx="12" fill="#041a15" stroke="url(#cardBorder)" stroke-width="1.2" />

        <!-- Top Status -->
        <g transform="translate(28, 24)">
          <text x="0" y="18" fill="#ffffff" font-size="18" font-weight="700" font-family="sans-serif">Connected AI Models &amp; API Keys</text>
          <text x="0" y="38" fill="#94a3b8" font-size="12" font-family="sans-serif">Keys are securely saved in chrome.storage.local</text>
        </g>

        <!-- Provider Card 1: Google Gemini -->
        <g transform="translate(28, 80)">
          <rect x="0" y="0" width="580" height="74" rx="10" fill="#072b22" stroke="#10b981" stroke-width="1.2" />
          <g transform="translate(16, 14)">
            <text x="0" y="16" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif">Google Gemini</text>
            <text x="0" y="34" fill="#a7f3d0" font-size="11" font-family="sans-serif">Active Model: gemini-1.5-flash (Ultra fast &amp; free tier)</text>

            <rect x="440" y="2" width="105" height="24" rx="12" fill="#064e3b" stroke="#34d399" stroke-width="1" />
            <circle cx="452" cy="14" r="3.5" fill="#34d399" />
            <text x="460" y="18" fill="#ecfdf5" font-size="11" font-weight="700" font-family="sans-serif">CONNECTED</text>
          </g>
        </g>

        <!-- Provider Card 2: OpenAI -->
        <g transform="translate(28, 166)">
          <rect x="0" y="0" width="580" height="74" rx="10" fill="#05221b" stroke="#13473b" />
          <g transform="translate(16, 14)">
            <text x="0" y="16" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif">OpenAI</text>
            <text x="0" y="34" fill="#94a3b8" font-size="11" font-family="sans-serif">Active Model: gpt-4o-mini (High reasoning accuracy)</text>

            <rect x="440" y="2" width="105" height="24" rx="12" fill="#064e3b" stroke="#34d399" stroke-width="1" />
            <circle cx="452" cy="14" r="3.5" fill="#34d399" />
            <text x="460" y="18" fill="#ecfdf5" font-size="11" font-weight="700" font-family="sans-serif">CONNECTED</text>
          </g>
        </g>

        <!-- Provider Card 3: Anthropic Claude -->
        <g transform="translate(28, 252)">
          <rect x="0" y="0" width="580" height="74" rx="10" fill="#05221b" stroke="#13473b" />
          <g transform="translate(16, 14)">
            <text x="0" y="16" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif">Anthropic Claude</text>
            <text x="0" y="34" fill="#94a3b8" font-size="11" font-family="sans-serif">Active Model: claude-3-5-sonnet (Superb nuanced writing)</text>

            <rect x="440" y="2" width="105" height="24" rx="12" fill="#064e3b" stroke="#34d399" stroke-width="1" />
            <circle cx="452" cy="14" r="3.5" fill="#34d399" />
            <text x="460" y="18" fill="#ecfdf5" font-size="11" font-weight="700" font-family="sans-serif">CONNECTED</text>
          </g>
        </g>

        <!-- Bottom Security Callout -->
        <g transform="translate(28, 342)">
          <rect x="0" y="0" width="580" height="64" rx="10" fill="#031f18" stroke="#10b981" stroke-opacity="0.3" stroke-dasharray="4 4" />
          <text x="18" y="26" fill="#34d399" font-size="12" font-weight="700" font-family="sans-serif">🛡️ Client-Direct Security Guarantee:</text>
          <text x="18" y="46" fill="#cbd5e1" font-size="12" font-family="sans-serif">
            All requests use direct HTTPS endpoints to Google, OpenAI &amp; Anthropic. No tracking. No telemetry.
          </text>
        </g>
      </g>
    </g>
  </g>
</svg>
"""

# Render dictionary
ASSETS = [
    {
        "name": "marquee-1400x560",
        "w": 1400,
        "h": 560,
        "fn": get_marquee_svg
    },
    {
        "name": "promo-tile-440x280",
        "w": 440,
        "h": 280,
        "fn": get_promo_tile_svg
    },
    {
        "name": "screenshot-1-hero-1280x800",
        "w": 1280,
        "h": 800,
        "fn": get_screenshot_1_svg
    },
    {
        "name": "screenshot-2-translate-1280x800",
        "w": 1280,
        "h": 800,
        "fn": get_screenshot_2_svg
    },
    {
        "name": "screenshot-3-summarize-1280x800",
        "w": 1280,
        "h": 800,
        "fn": get_screenshot_3_svg
    },
    {
        "name": "screenshot-4-write-1280x800",
        "w": 1280,
        "h": 800,
        "fn": get_screenshot_4_svg
    },
    {
        "name": "screenshot-5-byok-1280x800",
        "w": 1280,
        "h": 800,
        "fn": get_screenshot_5_svg
    }
]

def render_asset(asset):
    name = asset["name"]
    w = asset["w"]
    h = asset["h"]
    svg_content = asset["fn"]()

    svg_path = os.path.join(TMP_DIR, f"{name}.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    max_dim = max(w, h)
    # Render thumbnail with qlmanage at max_dim
    subprocess.run(["qlmanage", "-t", "-s", str(max_dim), "-o", TMP_DIR, svg_path],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    rendered_png = os.path.join(TMP_DIR, f"{name}.svg.png")
    if not os.path.exists(rendered_png):
        raise FileNotFoundError(f"Failed to render {rendered_png}")

    img = Image.open(rendered_png)
    rw, rh = img.size
    
    # Calculate crop coordinates to center the aspect ratio
    # qlmanage creates a square bounding box of size (max_dim, max_dim)
    # The SVG with aspect w/h is placed centered inside.
    scale = min(rw / w, rh / h)
    actual_w = int(w * scale)
    actual_h = int(h * scale)

    left = (rw - actual_w) // 2
    top = (rh - actual_h) // 2
    right = left + actual_w
    bottom = top + actual_h

    cropped = img.crop((left, top, right, bottom))
    final = cropped.resize((w, h), Image.Resampling.LANCZOS)

    out_path = os.path.join(OUT_DIR, f"{name}.png")
    final.save(out_path, "PNG", optimize=True)
    print(f"Generated {out_path} ({w}x{h} px)")

if __name__ == "__main__":
    for item in ASSETS:
        render_asset(item)
    print("All store assets successfully created!")
