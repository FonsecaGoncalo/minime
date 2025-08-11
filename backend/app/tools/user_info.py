import logging
from typing import Annotated

from haystack.tools import tool

from conversation_store import UserInfo

logger = logging.getLogger(__name__)


class UpdateUserInfo:
    def __init__(self, mem):
        self.mem = mem

    @tool(
        name="update_user_info",
        description="Store user info in memory"
    )
    def __call__(
            self,
            name: Annotated[str, "User name"],
            company: Annotated[str, "Company name"],
            role: Annotated[str, "Role name"],
    ) -> str:
        try:
            self.mem.store.save_user_info(UserInfo(name=name, company=company, role=role))
            return "ok"
        except Exception as e:
            logger.error(e)
            return "error"
