import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const App = () => {
  const [info, setInfo] = useState(() => {
    let initialVal = {};
    if (window.location?.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const myParam = urlParams.get("options") || "{}";
      const params = JSON.parse(myParam);
      initialVal = params.config;
    }
    return initialVal;
  });

  useEffect(() => {
    window.addEventListener("message", handleIframeApi);
  }, []);


  const handleIframeApi = async ({ data }) => {
    switch (data.action) {
      case "sendPayload":
        // do something
    }
  };
  return (
    
    <Box sx={{
      background:'white'
    }}>
      widget
    </Box>
  );
};

export default App
