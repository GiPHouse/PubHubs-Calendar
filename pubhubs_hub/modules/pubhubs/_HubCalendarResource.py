from synapse.http.site import SynapseRequest
from synapse.http.server import DirectServeJsonResource, respond_with_json

from ._validation import user_validator
from ._cors import set_allow_origin_header

import json


class HubCalendarResource(DirectServeJsonResource):
    async def _async_render_GET(self, request: SynapseRequest) -> bytes:
        set_allow_origin_header(request, self._config.allowed_origins)
        respond_with_json(request, 200, {"events": []})
    
    @user_validator()
    async def _async_render_POST(self, request: SynapseRequest, user_id: str
    ) -> bytes:
        set_allow_origin_header(request, self._config.allowed_origins)
        response = {}
        content = request.content.read()
        body = json.loads(content)
        data = request.args.get(b"data", [b""])[0].decode("utf-8")

        if not data:
            respond_with_json(request, 400, {"error": "Missing data parameter"})
            return

        match data:
            case _:
                respond_with_json(request, 200, {"data": data})
                return