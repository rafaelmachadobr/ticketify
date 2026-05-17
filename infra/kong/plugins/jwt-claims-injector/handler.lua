local cjson = require "cjson"
local base64 = require "ngx.base64"

local JwtClaimsInjector = {
  PRIORITY = 800,
  VERSION  = "1.0.0",
}

local function decode_base64url(s)
  -- Converte base64url → base64 padrão e decodifica
  local remainder = #s % 4
  if remainder == 2 then s = s .. "==" end
  if remainder == 3 then s = s .. "=" end
  s = s:gsub("-", "+"):gsub("_", "/")
  return ngx.decode_base64(s)
end

local function decode_jwt_payload(token)
  local parts = {}
  for part in token:gmatch("[^%.]+") do
    table.insert(parts, part)
  end
  if #parts ~= 3 then return nil end
  local payload_json = decode_base64url(parts[2])
  if not payload_json then return nil end
  local ok, payload = pcall(cjson.decode, payload_json)
  if not ok then return nil end
  return payload
end

function JwtClaimsInjector:access(conf)
  local auth_header = kong.request.get_header("Authorization")
  if not auth_header then return end

  local token = auth_header:match("^[Bb]earer%s+(.+)$")
  if not token then return end

  local payload = decode_jwt_payload(token)
  if not payload then return end

  -- Injeta claims como headers para serviços downstream
  if payload.sub then
    kong.service.request.set_header("X-User-Id", tostring(payload.sub))
  end
  if payload.email then
    kong.service.request.set_header("X-User-Email", tostring(payload.email))
  end
  if payload.role then
    kong.service.request.set_header("X-User-Role", tostring(payload.role))
  end

  -- Remove o header Authorization original para não expor o token internamente
  -- (opcional — manter se os serviços precisarem do token diretamente)
  -- kong.service.request.clear_header("Authorization")
end

return JwtClaimsInjector
