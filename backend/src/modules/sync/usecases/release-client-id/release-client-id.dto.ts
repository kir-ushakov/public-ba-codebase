export interface IReleaseClientIdRequestDTO {
  userId: string;
  // TODO: potentially have here type of device: `deviceId entityObject` or `deviceId entity String`
}

export interface  IReleaseClientIdResponseDTO {
 clientId: string;
}
