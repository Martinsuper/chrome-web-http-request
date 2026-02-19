export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Web HTTP Request 已加载');
  },
});
