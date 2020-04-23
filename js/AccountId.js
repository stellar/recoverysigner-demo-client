class AccountId extends React.Component {
  constructor(props) {
    super(props);
    this.baseURL = 'https://testnet.steexp.com/account/';
    if (this.props.baseURL != null) {
      this.baseURL = this.props.baseURL;
    }
  }

  render() {
    if (this.props.id != '') {
      return <a href={this.baseURL+this.props.id} target="_blank" rel="noopener noreferrer">{this.props.id.slice(0,4)}</a>;
    }
    return null;
  }
}
