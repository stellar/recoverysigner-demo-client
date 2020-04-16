class Clear extends React.Component {
  constructor(props) {
    super(props);
    this.handleClear = this.handleClear.bind(this);
  }

  render() {
    return (
      <fieldset>
        <legend>Clear</legend>
        <button onClick={this.handleClear}>Clear</button>
      </fieldset>
    );
  }

  handleClear() {
    this.props.onAccount('', '');
    this.props.onLog(`✅ Account details cleared (device key unchanged)`);
  }
}
