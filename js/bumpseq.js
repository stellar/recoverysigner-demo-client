class BumpSeq extends React.Component {
  constructor(props) {
    super(props);
    this.state = {seq: ''};
    this.handleSeqChange = this.handleSeqChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.submit = this.submit.bind(this);
    this.loadSeq = this.loadSeq.bind(this);
  }

  async componentDidMount() {
    await this.loadSeq();
  }

  render() {
    return (
      <fieldset>
        <legend>Bump Sequence</legend>
        <label>
          Seq:
          <input size={this.state.seq.length} value={this.state.seq} onChange={this.handleSeqChange} />
        </label>
        <button onClick={this.handleSubmit}>Submit Bump Sequence</button>
      </fieldset>
    );
  }

  handleSeqChange(event) {
    this.setState({seq: event.target.value})
  }

  async handleSubmit() {
    try {
      await this.submit();
    } catch(e) {
      this.props.onLog(`❌ Error: ${e.message}`);
    }
  }

  async loadSeq() {
    const account = await this.props.config.horizonServer.loadAccount(this.props.account);
    this.setState({seq: account.sequenceNumber()});
  }

  async submit() {
    this.props.onLog(<span>⏳ Bumping sequence for <AccountId id={this.props.account} /> to {this.state.seq}...</span>);

    const account = await this.props.config.horizonServer.loadAccount(this.props.account);
    this.props.onLog(`⏳ Account sequence number: ${account.sequenceNumber()}`);

    const tx = new StellarSdk.TransactionBuilder(account,
      { fee: StellarSdk.BASE_FEE, networkPassphrase: this.props.config.networkPassphrase })
      .addOperation(StellarSdk.Operation.bumpSequence({
        bumpTo: this.state.seq,
      }))
      .setTimeout(30)
      .build();
    tx.sign(this.props.deviceKey);
    this.props.onLog(<span>⏳ Submitting transaction <TxXdr xdr={tx.toXDR('base64')} />...</span>);
    await this.props.config.horizonServer.submitTransaction(tx);
    this.props.onLog(<span>⏳ Submitted transaction <TxId id={tx.hash().toString('hex')} /></span>);

    this.props.onLog(<span>✅ Bumped sequence for <AccountId id={this.props.account} /> to {this.state.seq}</span>);

    this.loadSeq();
  }
}
