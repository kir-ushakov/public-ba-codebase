import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/result.js';
import { DomainError } from '../../core/domain-error.js';

export interface IImageProps {
  imageId: string;
  userId: string;
  storageType: 'local' | 'googleDrive';
  fileId: string;
}

export class Image extends AggregateRoot<IImageProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get imageId(): string {
    return this.props.imageId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get storageType(): 'local' | 'googleDrive' {
    return this.props.storageType;
  }

  get fileId(): string {
    return this.props.fileId;
  }

  public static create(props: IImageProps, id?: UniqueEntityID): Result<Image, never> {
    const image = new Image(props, id);

    return Result.ok<Image, never>(image);
  }

  private constructor(props: IImageProps, id?: UniqueEntityID) {
    super(props, id);
  }
}
