import { IDesignItem, IProperty, IPropertyGroup, PropertyType } from "@node-projects/web-component-designer";
import { AbstractPolymerLikePropertiesService } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/AbstractPolymerLikePropertiesService.js";
import { SvgHmi } from "../SvgHmi.js";

export default class AttachedPropertiesService extends AbstractPolymerLikePropertiesService {
  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.element instanceof SvgHmi;
  }

  public override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    return Array.from((<SvgHmi>designItem.element)._svgHmiProperties.entries().map(x => ({
      name: x[1].name,
      type: x[1].type,
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    })));
  }
}
