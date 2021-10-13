import React from "react";
class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputHistory: [],
      inputHistoryCursor: 0,
      isTyping: false,
      isFetchingSuggestion: false,
      autoSuggestions: [],
      autoSuggestionCursor: 0,
    };
    this.keyboardInput = React.createRef();
    this.focusTextInput = this.focusTextInput.bind(this);
    this.verbSuggestions = (props.verbSuggestions &&
      this.props.verbSuggestions.map((verb) => {
        return {
          cmd: verb,
          description: verb,
        };
      })) || [
      {
        cmd: "search",
        description: "disocver files and file content",
      },
      {
        cmd: "compose",
        description: "create content",
      },
      {
        cmd: "request",
        description: "request document, script, or live consulting",
      },
      {
        cmd: "neighbors",
        description: "visit a neighbor and discover their content",
      },
      {
        cmd: "radio",
        description: "listen to radio",
      },
      {
        cmd: "share",
        description: "share security peer-to-peer",
      },
      {
        cmd: "broadcast",
        description: "live stream",
      },
      {
        cmd: "connect",
        description: "with people or IP addresses",
      },
    ];
  }

  focusTextInput() {
    this.keyboardInput.current.focus();
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.focusTextInput();
    }
    this.updateAutoSuggest();
  }

  stdin = (msg) => {
    alert(msg);
  };

  renderSuggestions = () => {
    if (this.state.isTyping === false) return null;

    return (
      <ul className="list-group suggestions">
        {this.state.autoSuggestions.map((suggestion, idx) => {
          const className =
            idx === this.state.autoSuggestionCursor
              ? "list-group-item active"
              : "list-group-item";
          return (
            <li
              className={className}
              onMouseEnter={(e) => {
                this.setState({ autoSuggestionCursor: idx });
              }}
              onClick={(e) => {
                this.keyboardInput.current.value = suggestion.cmd + " ";
                this.focusTextInput();
              }}
            >
              <b>{suggestion.cmd}</b>: {suggestion.description}
            </li>
          );
        })}
      </ul>
    );
  };

  updateAutoSuggest = (inputString) => {
    var typingFirstWord = !inputString || inputString.split(" ").length < 2;
    var typingSecondWord =
      !typingFirstWord && inputString.split(" ").length < 2;
    var currentWord = (inputString && inputString.split(" ").pop()) || "";

    if (typingFirstWord) {
      var matches = this.verbSuggestions.filter((suggestion) => {
        return !currentWord || suggestion.cmd.includes(currentWord);
      });

      this.setState({ autoSuggestions: matches });
    }
  };

  render() {
    const searchBarStyle = this.props.searchBarStyle || {
      position: "fixed",
      right: 150,
      top: 160,
      zIndex: -10,
    };

    const searchBarStyleTyping = this.props.searchBarStyleTyping || {
      position: "fixed",
      right: 150,
      top: 40,
      zIndex: "1 !important",
    };

    return (
      <div
        className="md-col-6"
        style={
          this.state.isTyping === false ? searchBarStyle : searchBarStyleTyping
        }
      >
        <input
          ref={this.keyboardInput}
          onClick={this.focusTextInput}
          onFocus={() => {
            this.setState({ isTyping: true });
          }}
          onBlur={() => {
            // this.setState({isTyping:false});
          }}
          onKeyDown={(e) => {
            if (e.keyCode == 13) {
              //enter
              this.stdin(e.target.value);
              e.target.value = "";
            } else if (e.keyCode == 9) {
              //tab
              this.setState({
                autoSuggestionCursor: this.state.autoSuggestionCursor + 1,
              });
              // if(this.state.autoSuggestions[this.state.autoSuggestionCursor] &&
              //     this.state.autoSuggestions[this.state.autoSuggestionCursor].cmd){
              //     e.target.value=this.state.autoSuggestions[this.state.autoSuggestionCursor].cmd+" ";
              // }
            } else if (e.keyCode == 32) {
              //space bar
              this.updateAutoSuggest(e.target.value);
            } else if (e.keyCode === 27) {
              //escape
              this.setState({
                isTyping: false,
              });
            } else {
              this.updateAutoSuggest(e.target.value);
            }
          }}
          placeholder={
            this.state.isTyping ? "type query" : "are you feeling lucky?"
          }
          className="form-control"
          type="text"
          size={this.props.size || 80}
        />

        {this.renderSuggestions()}
      </div>
    );
  }
}
export default SearchBar;
