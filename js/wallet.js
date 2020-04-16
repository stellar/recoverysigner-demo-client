class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.onLog = this.onLog.bind(this);
    this.onConfigChange = this.onConfigChange.bind(this);
    this.addDependenciesToConfig = this.addDependenciesToConfig.bind(this);

    const defaultConfig = {
      horizonServerURL: "https://horizon-testnet.stellar.org",
      networkPassphrase: StellarSdk.Networks.TESTNET,

      webauth1URL: "",
      recoverysigner1FirebaseConfig: {apiKey:"", projectId:""},
      recoverysigner1URL: "",

      webauth2URL: "",
      recoverysigner2FirebaseConfig: {apiKey:"", projectId:""},
      recoverysigner2URL: "",
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
    let recoverysigner1Firebase;
    try {
      recoverysigner1Firebase = firebase.app(config.recoverysigner1FirebaseConfig.projectId);
    } catch {
      if (config.recoverysigner1FirebaseConfig.projectId != '') {
        recoverysigner1Firebase = firebase.initializeApp(config.recoverysigner1FirebaseConfig, config.recoverysigner1FirebaseConfig.projectId);
      }
    }
    let recoverysigner2Firebase;
    try {
      recoverysigner2Firebase = firebase.app(config.recoverysigner2FirebaseConfig.projectId);
    } catch {
      if (config.recoverysigner2FirebaseConfig.projectId != '') {
        recoverysigner2Firebase = firebase.initializeApp(config.recoverysigner2FirebaseConfig, config.recoverysigner2FirebaseConfig.projectId);
      }
    }
    return {
      ...config,
      ...{
        horizonServer: new StellarSdk.Server(config.horizonServerURL, {}),
        recoverysigner1Firebase: recoverysigner1Firebase,
        recoverysigner2Firebase: recoverysigner2Firebase,
      },
    };
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
