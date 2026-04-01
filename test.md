# md2pdf 测试文档

这是一个用来测试 **md2pdf** 工具的示例文档。

## 功能特性

- ✅ 支持标准 Markdown 语法
- ✅ 三套精美主题（github / dark / minimal）
- ✅ 跨平台：Mac / Windows / Linux
- ✅ 支持数学公式（MathJax）

## 数学公式

行内公式：质能方程 $E = mc^2$，欧拉公式 $e^{i\pi} + 1 = 0$。

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

## 代码示例

下面这段 Go 代码用于验证代码块的排版、圆角、背景色和语法高亮是否正常。

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, md2pdf!")
}
```

## 表格

下面这张表用于检查表格的边框、间距、斑马纹和中英文混排的阅读效果。

| 主题    | 风格         | 适合场景     |
|---------|------------|------------|
| github  | 现代简洁     | 技术文档     |
| dark    | 暗色护眼     | 夜间阅读     |
| minimal | 衬线优雅     | 文章报告     |

## 引用

> 好的工具应该让用户感觉不到它的存在。

## 小结

用 `md2pdf test.md` 即可将本文件转换为 PDF，加上 `--math` 参数可渲染数学公式。
