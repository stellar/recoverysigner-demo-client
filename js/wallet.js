class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.onLog = this.onLog.bind(this);
    this.onConfigChange = this.onConfigChange.bind(this);
    this.addDependenciesToConfig = this.addDependenciesToConfig.bind(this);

    const defaultConfig = {
      horizonServerURL: "https://horizon-testnet.stellar.org",
      networkPassphrase: StellarSdk.Networks.TESTNET,

      recoverysigners: [
        {
          url: "",
          firebaseConfig: {apiKey:"", projectId:""},
          webauthURL: "",
        },
        {
          url: "",
          firebaseConfig: {apiKey:"", projectId:""},
          webauthURL: "",
        }
      ],
    };

    const hashStr = window.location.hash.substr(1);
    let config = {};
    if (hashStr != "") {
      config = JSON.parse(decodeURIComponent(hashStr));
    }

    this.state = {
      logs: [],
      config: {...defaultConfig, ...config},
    };
  }

  onLog(l) {
    this.setState((prevState, props) => {
      return {logs: [l].concat(prevState.logs), config: prevState.config};
    });
  }

  onConfigChange(config) {
    var url = '#'+encodeURIComponent(JSON.stringify(config));
    window.history.pushState(null, '', url);
    this.setState({logs: this.state.logs, config: config});
  }

  addDependenciesToConfig(config) {
    const newConfig = JSON.parse(JSON.stringify(config));
    newConfig.horizonServer = new StellarSdk.Server(config.horizonServerURL, {});
    try {
      for (var i=0; i<newConfig.recoverysigners.length; i++) {
        const rsConfig = newConfig.recoverysigners[i];
        let fb;
        try {
          fb = firebase.app(rsConfig.firebaseConfig.projectId);
        } catch {
          if (rsConfig.firebaseConfig.projectId != '') {
            fb = firebase.initializeApp(rsConfig.firebaseConfig, rsConfig.firebaseConfig.projectId);
          }
        }
        newConfig.recoverysigners[i].firebase = fb;
      }
    } catch(e) {
      console.log(e);
    }
    return newConfig;
  }

  render() {
    const fullConfig = this.addDependenciesToConfig(this.state.config);
    return (
      <div>
        <Config config={this.state.config} onConfigChange={this.onConfigChange} />
        <Account config={fullConfig} onLog={this.onLog} />
        <Logs logs={this.state.logs} />
      </div>
    );
  }
}
