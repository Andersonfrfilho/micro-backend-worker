import { UpdateAddressParams } from './address.repository.interface';

export interface AddressRepositoryUpdateParams {
  id: string;
  address: UpdateAddressParams;
}
