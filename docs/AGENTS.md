# Agents & Workflow Protocol

## Roles & Hierarchy
- **Manager (مدیر)**: Final decision maker and recipient of progress reports.
- **Architect Lead (معمار ارشد / Qwen)**: Architecture design, task breakdown, strategy definition, and quality oversight.
- **Execution Agent (Anti-Gravity / FLASH 3.7)**: Implementation of code, testing, debugging, and sole authorized gateway for external tool interaction.

## External Tool Access Rule
- **ChatGPT Integration**: Any task requiring the specific ChatGPT Custom GPT must be routed exclusively through the Execution Agent (Anti-Gravity / FLASH 3.7).
- **Designated URL**: `https://chatgpt.com/g/g-p-6a893db7cb1c8191a8816ce9844bbf42/c/6a893d8b-9dac-83eb-b2ca-e703d57e4b62`
- **Workflow**: Architect Lead defines the exact prompt/objective -> Execution Agent interacts with the ChatGPT link -> Execution Agent validates and integrates the output into the codebase.
