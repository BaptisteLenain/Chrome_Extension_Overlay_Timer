chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked, tab ID:", tab.id);
  try {
    await chrome.tabs.sendMessage(tab.id, "toggle-overlay");
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Failed to send message:", error);
    // Try to inject the content script if it's not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      console.log("Content script re-injected");
      // Try sending the message again
      await chrome.tabs.sendMessage(tab.id, "toggle-overlay");
    } catch (reinjectError) {
      console.error("Failed to re-inject content script:", reinjectError);
    }
  }
});
