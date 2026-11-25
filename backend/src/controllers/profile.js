import * as v from "../validators/index.js";
import { audit } from "../services/audit.js";
import { userDto } from "../services/auth.js";
export function profile(m, crypto) {
  const phone = (u) =>
    u.sensitivePhoneEncrypted
      ? v.phone.parse(
          crypto.decrypt(u.sensitivePhoneEncrypted, "phone:" + u.id),
        )
      : null;
  const dto = (u) => ({
    ...userDto(u),
    phoneMasked: phone(u)
      ? "***-***-" + phone(u).replace(/\D/g, "").slice(-4)
      : null,
  });
  return {
    get: async (req, res) => res.json({ data: dto(req.user) }),
    update: async (req, res) => {
      const data = v.profile.parse(req.body);
      await req.user.update({
        ...("name" in data ? { name: data.name } : {}),
        ...("phone" in data
          ? {
              sensitivePhoneEncrypted: data.phone
                ? crypto.encrypt(data.phone, "phone:" + req.user.id)
                : null,
            }
          : {}),
      });
      res.json({ data: dto(req.user) });
    },
    reveal: async (req, res) => {
      await audit(m, req, "profile.reveal");
      res.json({ data: { phone: phone(req.user) } });
    },
  };
}
