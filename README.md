# 💖 GPU 极限心形测试 (Bloom Edition)

这是一个基于 Three.js 的 3D 粒子/方块心形渲染项目，模拟了显卡压力测试的视觉效果。

## ✨ 特性
*   **百万级方块渲染**: 使用 `InstancedMesh` 技术优化性能。
*   **后期处理**: 集成 UnrealBloomPass 实现辉光效果。
*   **程序化纹理**: 动态生成熔岩、赛博、金属等材质纹理。
*   **无限超频模式**: 填满后自动叠加层数，无限增加密度。

## 🚀 如何部署到 GitHub Pages

### 方法 1: 直接上传 (最简单)
1.  登录你的 [GitHub](https://github.com/) 账号。
2.  创建一个新的仓库 (Repository)，例如命名为 `heart-stress-test`。
3.  在仓库页面点击 "uploading an existing file"。
4.  将本文件夹中的 `index.html`, `script.js` 拖拽上传并提交。
5.  进入仓库 **Settings** -> **Pages**。
6.  在 **Branch** 选项中选择 `main` (或 `master`)，文件夹选择 `/ (root)`，点击 Save。
7.  等待几分钟，刷新页面，你将获得一个 `https://yourname.github.io/heart-stress-test/` 的链接。

### 方法 2: 使用 Git 命令行 (推荐)
如果你本地安装了 Git，可以按以下步骤操作：

1.  **初始化仓库**:
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Heart Stress Test"
    ```

2.  **关联远程仓库** (先在 GitHub 上创建空仓库):
    ```bash
    git remote add origin https://github.com/你的用户名/仓库名.git
    git branch -M main
    git push -u origin main
    ```

3.  **开启 GitHub Pages**:
    *   同方法 1 的第 5-7 步。

## 🛠️ 本地运行
如果你想在本地查看：
1.  确保安装了 Python 或 Node.js。
2.  在当前目录下运行：
    ```bash
    # Python 3
    python -m http.server 8000
    
    # 或者使用 Node.js http-server
    npx http-server
    ```
3.  浏览器访问 `http://localhost:8000`。
