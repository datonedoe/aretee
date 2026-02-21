import { memo, useMemo } from 'react'
import { Text, View, Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { Colors } from '../../utils/constants'

interface MathTextProps {
  text: string
  fontSize?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  style?: object
}

/**
 * Detect if text contains math notation that needs special rendering.
 * Checks for LaTeX delimiters ($...$, $$...$$) and common math symbols
 * that don't render well in plain text.
 */
function containsMath(text: string): boolean {
  // LaTeX delimiters
  if (/\$\$.+?\$\$/s.test(text)) return true
  if (/(?<!\$)\$.+?\$(?!\$)/.test(text)) return true
  // Common math patterns that render poorly in plain text
  if (/[_^{}\\]/.test(text) && /[a-zA-Z]/.test(text)) return true
  // Partial derivatives, integrals, summations with subscripts
  if (/[∂∫∑∏].*[₀₁₂₃₄₅₆₇₈₉]/.test(text)) return true
  // Fractions written as \frac or similar
  if (/\\frac|\\sqrt|\\sum|\\int|\\partial/.test(text)) return true
  return false
}

/**
 * Normalize math text for KaTeX rendering.
 * Wraps plain math expressions in $ delimiters if not already wrapped.
 */
function normalizeMath(text: string): string {
  // Already has LaTeX delimiters — use as-is
  if (/\$/.test(text)) return text
  // Wrap the whole thing in display math
  return `$$${text}$$`
}

const KATEX_HTML = (math: string, fontSize: number, color: string, textAlign: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: transparent;
    color: ${color};
    font-size: ${fontSize}px;
    text-align: ${textAlign};
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 8px;
    font-family: -apple-system, system-ui, sans-serif;
    overflow: hidden;
  }
  .katex { font-size: ${fontSize * 1.1}px !important; color: ${color} !important; }
  .katex-display { margin: 0 !important; }
  .katex-display > .katex { text-align: ${textAlign} !important; }
  #content { width: 100%; }
</style>
</head>
<body>
<div id="content">${math.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
<script>
  renderMathInElement(document.getElementById('content'), {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false},
      {left: '\\\\(', right: '\\\\)', display: false},
      {left: '\\\\[', right: '\\\\]', display: true}
    ],
    throwOnError: false
  });
  // Send height to RN
  setTimeout(() => {
    const h = document.documentElement.scrollHeight;
    window.ReactNativeWebView?.postMessage(JSON.stringify({height: h}));
  }, 200);
</script>
</body>
</html>
`

/**
 * MathText — renders text with proper math typesetting when math notation is detected.
 * Falls back to plain Text for non-math content.
 */
export const MathText = memo(function MathText({
  text,
  fontSize = 20,
  color = Colors.text,
  textAlign = 'center',
  style,
}: MathTextProps) {
  const hasMath = useMemo(() => containsMath(text), [text])

  if (!hasMath) {
    return (
      <Text
        style={[
          {
            color,
            fontSize,
            fontWeight: '500',
            textAlign,
            lineHeight: fontSize * 1.5,
          },
          style,
        ]}
      >
        {text}
      </Text>
    )
  }

  const mathText = normalizeMath(text)
  const html = KATEX_HTML(mathText, fontSize, color, textAlign)

  return (
    <View style={[{ width: '100%', minHeight: fontSize * 3 }, style]}>
      <WebView
        source={{ html }}
        style={{ backgroundColor: 'transparent', flex: 1, minHeight: fontSize * 3 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled
      />
    </View>
  )
})
