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
        const { Setting, Title, onRemove, buildSelected, onChangeLibertyBaselineRelease, onChangeLibertyTargetRelease, libertyBaselineRelease, libertyTargetRelease, libertyGMList, ...props } = this.props;
        let isLibertySUFPWidget = buildSelected != undefined && this.props.buildSelected.includes("LibertySUFP");
        let selectLibertyBaselineRelease = libertyBaselineRelease != null ? libertyBaselineRelease : "default";
        let selectLibertyTargetRelease = libertyTargetRelease != null ? libertyTargetRelease : "All";
        // console.log(this.props);
        // console.log(Title);
        // console.log("Toolbar Baseline", selectLibertyBaselineRelease);
        // console.log(buildSelected);
        // console.log("ToolBar libertyGMList", libertyGMList);
        return <div className="widget--header" style={{ position: 'relative', borderBottom: '1px solid #eceef7', height: 26 }}>
            <div className="widget--header-info">
                {isLibertySUFPWidget && <Title buildSelected={buildSelected} /> }
                {!isLibertySUFPWidget && <Title {...props} /> }
            </div>
            
            {isLibertySUFPWidget && <Select defaultValue={selectLibertyBaselineRelease} value={selectLibertyBaselineRelease} onChange={onChangeLibertyBaselineRelease}>
                <Option value="default">Select a Baseline Release</Option>
                {libertyGMList && libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
            </Select>}
            {isLibertySUFPWidget && <Select defaultValue={selectLibertyTargetRelease} value={selectLibertyTargetRelease} onChange={onChangeLibertyTargetRelease}>
                <Option value="default">Select a Target Release</Option>
                <Option value="All">All Releases</Option>
                {libertyGMList && libertyGMList.results.map((libertyGM, index) => (
                    <Option key={index} value={libertyGM._id} >{libertyGM._id}</Option>
                ))}
            </Select>}
            {Setting && <Settings Setting={Setting} {...props} />}
            <Button size="small" onClick={onRemove}><Icon type="close" /></Button>
        </div>
    }
}
