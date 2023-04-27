import MarkdownDisplay, { ReactRenderingOptions } from 'laydown-react';
import { CodeBlock, CodeSpan } from './nodes/CodeBlock';
import MathBlock, { MathSpan } from './nodes/MathBlock';

const md = `

# Test Markdown

This is a test string of Markdown Parsing.

<!-- heading: align-center -->
<!-- heading: use-hash#test-hash -->
# Align Center Heading

|Table|Heading|
|:----|------:|
|Table|Content|


<!-- layout: start#h4 -->

## Layout 1

<!-- layout: no-heading -->

111
## Fake Layout 1

test 1

### Layout 2 

\`test\` 2

<!-- layout: disp -->

test 3 without title
$$$
\\frac{without}{title}
$$$


<!-- layout: start#v -->

### Cascaded Layout 1

content

### Cascaded Layout 2

content

<!-- layout: end -->

<!-- heading: no-link -->
## Layout 4

test 4

\`\`\`
Gan Si 
Huang Xu Dong!
\`\`\`

<!-- layout: start -->
123456

# 789

101112

<!-- layout: end -->

Bai Qiu Dai Chong Feng!

@[test-template]

@[test-template-2](a=1, b="2")


`;

const options: ReactRenderingOptions = {
  codeHandler: (props) => {
    const { lang, type, content, block } = props;
    if (type === 'code') {
      if (block) {
        return <CodeBlock lang={lang}>{ content }</CodeBlock>;
      } else {
        return <CodeSpan lang={lang}>{ content }</CodeSpan>;
      } 
    } else {
      if (block) {
        return <MathBlock>{ content }</MathBlock>;
      } else {
        return <MathSpan>{ content }</MathSpan>;
      } 
    }
  }
};


function App() {

  return (
    <div className="App">
      <MarkdownDisplay options={options}>
        { md }
      </MarkdownDisplay>
    </div>
  );
}

export default App;
