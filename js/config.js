class Config extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {config: props.config};
  }

  render() {
    const json = JSON.stringify(this.state.config, null, 2);
    let rows = 1;
    let cols = 0;
    let currentRowCols = 0;
    for (var i = 0; i < json.length; i++) {
      const c = json.charAt(i);
      if (c == '\n') {
        rows++;
        currentRowCols = 0;
      } else {
        currentRowCols++;
        if (currentRowCols > cols) {
          cols = currentRowCols;
        }
      }
    }
    return (
      <fieldset>
        <legend>Config</legend>
        <textarea value={json} rows={rows} cols={cols} onChange={this.handleChange} />
      </fieldset>
    );
  }

  handleChange(event) {
    const config = JSON.parse(event.target.value);
    this.setState({config: config});
    this.props.onConfigChange(config);
  }
}
