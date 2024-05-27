# Welcome to Chatbot!

If you wanna run this on your local, just clone this repo then run:
``npm i``
after all packages are installed, you must edit some file on:
- node_modules/
  - whatsapp-web.js/
    - src/
      - webCache/
        - LocalWebCache.js

In LocalWebCache.js
```
async persist(indexHtml) {
        // extract version from index (e.g. manifest-2.2206.9.json -> 2.2206.9)
        const version = indexHtml.match(/manifest-([\d\\.]+)\.json/)[1];
        if(!version) return; 
        const filePath = path.join(this.path, `${version}.html`);
        fs.mkdirSync(this.path, { recursive: true });
        fs.writeFileSync(filePath, indexHtml);
    }
```
A workaround provided by another user consists of manually placing the version in the code, like this:
```
    async persist(indexHtml) {
        // extract version from index (e.g. manifest-2.2206.9.json -> 2.2206.9)
        let version;
        if (indexHtml.match(/manifest-([\d\\.]+)\.json/) === null) {
            version = '2.2409.2';
        } else {
            version = indexHtml.match(/manifest-([\d\\.]+)\.json/)[1];
        }
        if (!version) return;

        const filePath = path.join(this.path, `${version}.html`);
        fs.mkdirSync(this.path, { recursive: true });
        fs.writeFileSync(filePath, indexHtml);
    }
```
Then,  Add this argument to your Client initialization:

```javascript
webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
```
It should end up looking like this:

```javascript
const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});
```
