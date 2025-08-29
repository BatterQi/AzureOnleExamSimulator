# AZ-305 刷题器（静态网页版）

此项目由 ChatGPT 自动从你上传的 PDF（AZ-305 Exam - 题目.pdf）抽取 **286 道题**并生成。可直接部署到 **GitHub Pages** 使用，无需服务器。

## 功能
- 搜索、按 Topic/类型筛选
- 随机练习、50 题模拟考试
- 错题本（本地存储）
- 导出/导入 进度 与 答案键（JSON）
- 深色模式

> 说明：原 PDF 未包含标准答案，本项目支持导入答案键（按题号）。

## 本地使用
直接打开 `index.html` 即可。

## 部署到 GitHub Pages
1. 在 GitHub 新建仓库（建议名：`az305-quiz`）。
2. 上传本目录全部文件（`index.html`, `app.js`, `styles.css`, `questions.json`, `README.md`）。
3. 进入 **Settings → Pages**，Source 选择 `Deploy from a branch`，分支 `main`，目录 `/root`。
4. 保存后等待几分钟，访问 Pages 提供的 URL 即可在线刷题。

## 导入答案键
- 点击页面上的 **“导入答案/进度”**，粘贴如下 JSON：

```json
{
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "A,C",   // 多选可用逗号分隔
    "5": "D"
  }
}
```

## 数据结构
- `questions.json` 中关键字段：
  - `qnum`：与 PDF 中的 “Question #” 编号一致（导入答案时使用这个编号）。
  - `type`：`single_or_multi` 或 `hotspot_or_dragdrop_or_open`。
  - `topic`：如 `Topic 1`。
  - `question`、`options[]`：题干与选项（若无选项则为空）。

---

> 题库来源：你上传的 PDF。请在学习中注意遵守考试与版权政策。
