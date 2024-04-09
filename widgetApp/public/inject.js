(() => {
    const widgetContainerName = "web-widget-container";
    const widgetName = "web-widget";
    let IframeWindow = null;
  
    function createHTMLElement(tag, targetSelector, attributes = {}) {
      const element = document.createElement(tag);
      Object.entries(attributes).forEach(([attribute, value]) => element[attribute] = value);
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) throw new Error(`No element corresponds to ${targetSelector}`);
      targetElement.appendChild(element);
      return element;
    }
  
  
    function generateIframe(src, info) {
      const iframeId = widgetName;
      const title = encodeURIComponent(info?.botName || "widget");
      const iframeSrc = `${src}/index.html?options=${encodeURIComponent(JSON.stringify({
        config: Object.assign({}, info)
      }))}`;
      return `<iframe id="${iframeId}" title="${title}" frameborder="0" src="${iframeSrc}" class="widget-web widget-medium"/>`;
    }
  
    function createWidgetProxy(id, widgetInstance) {
      return new Proxy(widgetInstance, {
        get: (target, property) => target[property] ? target[property] :
          (property === "iframeWindow" ? () => {
            console.warn(`No widget with id ${id} has been initialized. \n`);
          } : (property === "eventListener" ? {
            handler: () => {},
            types: []
          } : undefined)),
        set: (target, property, value) => (target[property] = value, true)
      });
    }
  
    
  
    function getElementById(widgetContainerId, widgetId) {
      return document.querySelector(`#${widgetContainerId} #${widgetId}`);
    }
  
    window.addEventListener("message", ({
      data
    }) => {
      let topics, handler, eventListener;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "UI.RESIZE") {
        const newWidth = typeof data.value === "number" ? `${data.value}px` : data.value;
        getElementById(widgetContainerName, widgetName).style.width = newWidth;
      }
      if (data.type === "UI.SET-CLASS") {
        getElementById(widgetContainerName, widgetName).setAttribute("class", data.value.join(' '));
      }
      if(data.type === "COPY_TEXT"){
        navigator.clipboard.writeText(data.text);
      }
      if(data.type === "REDIRECT"){
        window.open(data.value[0], "_blank");
      }
      eventListener = IframeWindow;
      if (eventListener && (topics = eventListener.eventListener.topics) &&
        topics.some((topic) => topic === "*" || topic === data.type)) {
        handler = eventListener.eventListener.handler;
        if (handler) handler.call(eventListener, data);
      }
    });
  
    window.widgetWeb = {
      init: function(botConfig, targetElementId) {
        targetElementId = targetElementId || "body";
        botConfig.id = widgetName;
        const hostUrl = botConfig.hostUrl || "";
        createHTMLElement("link", "head", {
          rel: "stylesheet",
          href: `${hostUrl}/inject.css`
        });
        const iframeMarkup = generateIframe(hostUrl, botConfig);
        const containerId = widgetContainerName;
        const widgetId = widgetName;
        createHTMLElement("div", targetElementId, {
          id: containerId,
          innerHTML: iframeMarkup
        });
        const widgetProxy = createWidgetProxy(widgetId, {
          iframeWindow: getElementById(containerId, widgetId).contentWindow
        });
        IframeWindow = widgetProxy
      },
      configure: function(config) {
        IframeWindow && IframeWindow.iframeWindow && IframeWindow.iframeWindow.postMessage({
          action: "configure",
          payload: config
        }, "*");
      },
      sendEvent: function(event) {
        IframeWindow && IframeWindow.iframeWindow && IframeWindow.iframeWindow.postMessage({
          action: "event",
          payload: event
        }, "*");
      },
      mergeConfig: function(config) {
        IframeWindow && IframeWindow.iframeWindow && IframeWindow.iframeWindow.postMessage({
          action: "mergeConfig",
          payload: config
        }, "*");
      },
      sendPayload: function(payload) {
        IframeWindow && IframeWindow.iframeWindow && IframeWindow.iframeWindow.postMessage({
          action: "sendPayload",
          payload: payload
        }, "*");
      },
      onEvent: function(handler, topics = []) {
        if (typeof handler !== "function") throw new Error("EventHandler is not a function, please provide a function");
        if (!Array.isArray(topics)) throw new Error("Topics should be an array of supported event types");
        const eventListenerConfig = {
          eventListener: {
            handler: handler,
            topics: topics
          }
        };
        Object.assign(IframeWindow, eventListenerConfig);
      }
    }
  })();