class TxId extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <a href={'https://testnet.steexp.com/tx/'+this.props.id} target="_blank" rel="noopener noreferrer">{this.props.id}</a>
    );
  }
}
