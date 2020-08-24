import React, { Component } from 'react';
import { Popover, Button, Icon, Select } from 'antd';

class Settings extends Component {
    render() {
        const { Setting, ...props } = this.props;

        return <Popover content={<Setting {...props} />} trigger="click" placement="bottomLeft">
            <Button size="small"><Icon type="setting" /></Button>
        </Popover>
    }
}

export default class ToolBar extends Component {

    render() {
        const { Option } = Select;
        const { Setting, Title, onRemove, buildSelected, onChangeLibertyBaselineRelease, onChangeLibertyTargetRelease, libertyBaselineRelease, libertyTargetRelease, ...props } = this.props;
        let isLibertySUFPWidget = buildSelected != undefined && this.props.buildSelected.includes("LibertySUFP");
        let selectLibertyBaselineRelease = libertyBaselineRelease != null ? libertyBaselineRelease : "default";
        let selectLibertyTargetRelease = libertyTargetRelease != null ? libertyTargetRelease : "default";

        return <div className="widget--header" style={{ position: 'relative', borderBottom: '1px solid #eceef7', height: 26 }}>
            <div className="widget--header-info"><Title {...props} /></div>
            
            {isLibertySUFPWidget && <Select defaultValue={selectLibertyBaselineRelease} onChange={onChangeLibertyBaselineRelease}>
                <Option value="default">Select a Baseline Release</Option>
                {props.libertyGMList && props.libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
            </Select>}
            {isLibertySUFPWidget && <Select defaultValue={selectLibertyTargetRelease} onChange={onChangeLibertyTargetRelease}>
                <Option value="default">Select a Target Release</Option>
                <Option value="All">All Releases</Option>
                {props.libertyGMList && props.libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
            </Select>}
            {Setting && <Settings Setting={Setting} {...props} />}
            <Button size="small" onClick={onRemove}><Icon type="close" /></Button>
        </div>
    }
}
