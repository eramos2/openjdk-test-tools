import React, { Component } from 'react';
import ToolBar from './ToolBar';

export default class WidgetWrapper extends Component {

    render() {
        const { Widget, ...props } = this.props;
        const { style, ...widget } = Widget;
        //console.log(this.props);
        //console.log(widget);
        return <div className="widget" style={style}>
            <ToolBar {...props} {...widget} />
            <div className="widget--content">
                <Widget {...props} />
            </div>
        </div>
    }
}
