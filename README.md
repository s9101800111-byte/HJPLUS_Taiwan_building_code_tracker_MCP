# Taiwan Building Code Tracker MCP Server

這是一個基於 Node.js 的 Model Context Protocol (MCP) 伺服器，專門用於搜尋台灣「建築技術規則建築構造編」的條文。

## 功能
- **全文本搜尋**：從「全國法規資料庫」抓取最新條文並建立快取。
- **權重搜尋演算法**：
  - 條號匹配：高權重 (20)
  - 章節標題匹配：中權重 (10)
  - 條文內容匹配：基礎權重 (1 每次出現)
  - 多關鍵字全匹配獎勵：1.5 倍加成
- **本地快取**：自動將抓取的法規存儲在 `data/law_cache.json` 中，避免頻繁請求被阻擋。

## 安裝與執行

### 1. 安裝依賴
```bash
npm install
```

### 2. 編譯與執行
```bash
npm run build
npm start
```

## 在 MCP Client (如 Claude Desktop) 中配置

將以下內容加入您的 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taiwan-building-code": {
      "command": "node",
      "args": ["C:/Users/h3019/Documents/vscode_projects/Taiwam_building_code_tracker/dist/index.js"]
    }
  }
}
```

## 可用的工具

### `search_building_code`
搜尋建築技術規則建築構造編條文。
- **參數**:
  - `query` (string): 搜尋關鍵字 (例如: "活載重", "地震力")。
  - `limit` (number, 選填): 回傳結果上限。

### `refresh_data`
強制重新從全國法規資料庫抓取最新資料。

## 數據來源
[全國法規資料庫 - 建築技術規則建築構造編 (D0070115)](https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070115)
