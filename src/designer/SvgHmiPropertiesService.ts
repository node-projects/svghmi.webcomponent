import { AbstractPolymerLikePropertiesService, IDesignItem, IProperty, IPropertyGroup, PropertyType, RefreshMode } from "@node-projects/web-component-designer";
import { SvgHmi } from "../SvgHmi.js";

export default class SvgHmiPropertiesService extends AbstractPolymerLikePropertiesService {
  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.element instanceof SvgHmi;
  }

  override getRefreshMode(designItem: IDesignItem): RefreshMode {
    return RefreshMode.fullOnValueChange;
  }

  public override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    return [{
      name: 'src',
      type: 'string',
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, ...(<SvgHmi>designItem.element)._svgHmiProperties.entries().map(x => ({
      name: x[1].name,
      propertyName: x[1].name,
      attributeName: x[0],
      type: x[1].type,
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }))];
  }
}
