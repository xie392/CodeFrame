## 1. 规范更新

- [x] 1.1 更新 options 规范 - 补充截图质量设置的具体定义和生效说明
- [x] 1.2 更新 screenshot 规范 - 补充截图捕获时应用 quality 设置的场景
- [x] 1.3 更新 editor 规范 - 补充导出时应用 quality 设置的说明
- [x] 1.4 更新 codegen 规范 - 补充导出时应用 quality 设置的说明

## 2. 代码实现

- [x] 2.1 修改 `capture.ts` - 可视区域截图应用 quality 设置
- [x] 2.2 修改 `capture.ts` - 区域截图应用 quality 设置
- [x] 2.3 修改 `fullpage.ts` - 整页截图应用 quality 设置
- [x] 2.4 验证 Editor 导出已正确应用 quality 设置
- [x] 2.5 验证 Codegen 导出已正确应用 quality 设置

## 3. 测试验证

- [x] 3.1 构建通过
- [ ] 3.2 手动测试截图捕获 - 标准/高清/超高清三种质量输出正确
- [ ] 3.3 手动测试 Editor 导出 - 各质量等级导出尺寸正确
- [ ] 3.4 手动测试 Codegen 导出 - 各质量等级导出尺寸正确
- [ ] 3.5 验证设置持久化 - 修改质量设置后重新截图仍生效
