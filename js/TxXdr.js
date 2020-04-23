class TxXdr extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <a href={'https://laboratory.stellar.org/#xdr-viewer?input='+encodeURIComponent(this.props.xdr)} target="_blank" rel="noopener noreferrer" className="xdr">{this.props.xdr.slice(0, 40)}</a>
    );
  }
}
