# CrabOptimize

**CrabOptimize** is a next-generation WordPress image optimization plugin that leverages the power of WebAssembly (WASM) and Rust to convert images to modern formats (like AVIF and WebP) directly in the user's browser. By offloading the heavy lifting of image compression to the client side, CrabOptimize drastically reduces server load and boosts your site's performance.

https://github.com/user-attachments/assets/be2f9faa-4c30-4d0d-925f-062a732c3948

## Features

- **Client-Side Optimization:** Uses WebAssembly and Rust to process images in the browser before they are uploaded to the server.
- **Modern Formats:** Supports converting images to next-gen formats like AVIF and WebP.
- **Zero Server Load:** Saves server CPU and memory by avoiding server-side image processing.
- **Media Library Integration:** Seamlessly integrates with the native WordPress Media Library, including a custom "Crab Optimized" status column.
- **Bulk Migration Tool:** Easily scan and migrate your existing unoptimized images to modern formats, automatically updating post content to reflect the new image URLs.
- **Highly Extensible:** Built with developers in mind, featuring a comprehensive suite of actions and filters.

## Installation

1. Download the plugin zip file or clone the repository into your WordPress `wp-content/plugins/` directory:
   ```bash
   git clone https://github.com/DarkMatter-999/CrabOptimize.git
   cd CrabOptimize
   npm install
   npm run build
   ```
2. Navigate to the **Plugins** menu in your WordPress admin dashboard.
3. Locate **CrabOptimize** and click **Activate**.
4. Go to **Media > CrabOptimize** to configure your optimization settings (Format, Quality, Speed, etc.).

## Developer Documentation

CrabOptimize is built to be highly extensible. For a comprehensive list of available actions and filters you can use to customize the plugin's behavior, please refer to the [Developer Documentation](DOCS.md).

## License

This project is licensed under the GPL v2 or later. See the [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html) file for details.
