import { Injectable, BadRequestException } from '@nestjs/common';
import { DeliveryProvider } from '../interfaces/delivery-provider.interface';
import { ProviderAAdapter } from '../adapters/provider-a/provider-a.adapter';
import { ProviderBAdapter } from '../adapters/provider-b/provider-b.adapter';

@Injectable()
export class DeliveryProviderFactory {
  constructor(
    private readonly providerA: ProviderAAdapter,
    private readonly providerB: ProviderBAdapter,
  ) {}

  getProvider(providerName: string): DeliveryProvider {
    switch (providerName.toUpperCase()) {
      case 'PROVIDER_A':
        return this.providerA;
      case 'PROVIDER_B':
        return this.providerB;
      default:
        throw new BadRequestException(
          `Unsupported delivery provider: ${providerName}`,
        );
    }
  }
}
